"""
Smart outfit planning service.
Generates a 7-day outfit plan using color contrast matching,
wear-count awareness, and variety optimization.
Works with even just 2-3 items by reusing them across different days.
"""
import random
import colorsys
import math
from datetime import datetime, timedelta
from itertools import product as itertools_product


# Map all clothing types to outfit slots
TOP_TYPES = {"shirt", "tshirt", "formal_shirt", "hoodie", "sweater", "kurta", "sherwani", "blazer"}
BOTTOM_TYPES = {"jeans", "formal_pants", "cargo_pants", "shorts", "track_pants", "pyjama", "pants", "skirt"}
SHOE_TYPES = {"shoes", "sneakers", "loafers", "sandals", "slippers"}
OUTERWEAR_TYPES = {"jacket", "coat", "blazer", "hoodie", "sweater"}
ACCESSORY_TYPES = {"watch", "belt", "cap", "socks", "ring", "chain", "bracelet", "tie", "scarf", "bag", "accessories"}

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

DAY_STYLES = {
    "Monday": "semi-formal",
    "Tuesday": "semi-formal",
    "Wednesday": "casual",
    "Thursday": "semi-formal",
    "Friday": "casual",
    "Saturday": "casual",
    "Sunday": "casual",
}

OCCASION_STYLE_MAP = {
    "Work": "semi-formal",
    "Office": "semi-formal",
    "Meeting": "formal",
    "Business": "formal",
    "Formal Event": "formal",
    "Wedding": "traditional",
    "Traditional": "traditional",
    "Party": "casual",
    "Date": "semi-formal",
    "Gym": "casual",
    "Workout": "casual",
    "Casual": "casual",
    "Home": "casual",
    "Outing": "casual",
}


def _rgb_to_hsl(r, g, b):
    """Convert RGB (0-255) to HSL (0-360, 0-100, 0-100)."""
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return h * 360, s * 100, l * 100


def _color_contrast_score(color1, color2):
    """
    Score how well two RGB colors contrast.
    Higher = better contrast = better outfit pairing.
    Uses HSL distance for perceptually accurate matching.
    """
    if not color1 or not color2:
        return 50  # neutral if missing

    h1, s1, l1 = _rgb_to_hsl(*color1)
    h2, s2, l2 = _rgb_to_hsl(*color2)

    # Hue distance (circular, 0-180)
    hue_diff = min(abs(h1 - h2), 360 - abs(h1 - h2))

    # Lightness contrast (dark top + light bottom or vice versa)
    lightness_diff = abs(l1 - l2)

    # Saturation harmony (similar saturation = harmonious)
    sat_diff = abs(s1 - s2)

    score = 0

    # Complementary colors (hue_diff ~120-180) = high contrast, great pairing
    if hue_diff > 120:
        score += 35
    elif hue_diff > 60:
        score += 25  # Analogous-complementary
    elif hue_diff > 30:
        score += 15  # Triadic-like
    elif hue_diff < 10:
        score += 10  # Monochromatic (acceptable if lightness differs)

    # Lightness contrast rewards
    if lightness_diff > 40:
        score += 30  # Strong contrast (e.g., dark top + light bottom)
    elif lightness_diff > 20:
        score += 20  # Good contrast
    elif lightness_diff > 10:
        score += 10  # Subtle
    else:
        score += 5   # Too similar

    # Saturation harmony bonus
    if sat_diff < 20:
        score += 10  # Colors "feel" similar intensity

    # Classic combos bonus
    is_neutral1 = s1 < 15  # grays, blacks, whites
    is_neutral2 = s2 < 15
    if is_neutral1 or is_neutral2:
        score += 15  # Neutrals go with everything

    return min(score, 100)


def _get_primary_color(item):
    """Get the primary color from an item, with fallback."""
    if item.get("primary_color"):
        return item["primary_color"]
    if item.get("colors") and len(item["colors"]) > 0:
        return item["colors"][0]
    return [128, 128, 128]


def _wear_penalty(item):
    """Items worn more often get a slight penalty to encourage variety."""
    count = item.get("wear_count", 0)
    if count == 0:
        return 5   # Bonus for unworn items
    elif count <= 2:
        return 0
    elif count <= 5:
        return -5
    else:
        return -10  # Heavily worn, suggest less


def _serialize_item(item):
    """Convert an item to JSON-safe format for API response."""
    return {
        "_id": str(item["_id"]),
        "type": item.get("type", "unknown"),
        "style": item.get("style", "casual"),
        "image_url": item.get("image_url", ""),
        "primary_color": _get_primary_color(item),
        "color_name": item.get("color_name", ""),
        "colors": item.get("colors", []),
        "wear_count": item.get("wear_count", 0),
        "laundry_threshold": item.get("laundry_threshold", 3),
        "last_worn": item.get("last_worn").isoformat() if item.get("last_worn") else None,
        "occasion_tags": item.get("occasion_tags", []),
        "name": item.get("name", item.get("type", "Item")),
    }


def _generate_explanation(top, bottom, shoes, outerwear, weather_data, target_style, occasion):
    """Generate a human-friendly explanation for the outfit choice."""
    temp = weather_data.get("temp_c", 20) if weather_data else 20
    is_raining = weather_data.get("is_raining", False) if weather_data else False
    
    reasons = []
    
    # Style/Occasion context
    reasons.append(f"This {target_style} look is curated for your {occasion} plans.")
    
    # Color harmony
    top_color = top.get("color_name", "this color")
    bottom_color = bottom.get("color_name", "this color")
    reasons.append(f"The {top_color} {top['type']} and {bottom_color} {bottom['type']} create a high-contrast, sharp aesthetic.")
    
    # Weather context
    if temp < 15:
        reasons.append(f"Since it's a bit chilly ({temp}°C), we've prioritized warmth and layering.")
    elif temp > 25:
        reasons.append(f"At {temp}°C, this breathable combination will keep you cool and comfortable.")
    
    if is_raining:
        reasons.append("We've also selected items that are practical for today's rain.")
        
    if outerwear:
        reasons.append(f"Added a {outerwear.get('color_name', '')} {outerwear['type']} as a stylish outer layer.")

    return " ".join(reasons)


def _group_by_slot(clothes):
    """Group clothes into outfit slots: tops, bottoms, shoes, outerwear, accessories."""
    slots = {
        "top": [],
        "bottom": [],
        "shoes": [],
        "outerwear": [],
        "accessory": [],
    }

    for item in clothes:
        item_type = item.get("type", "unknown")
        if item_type in TOP_TYPES:
            slots["top"].append(item)
        elif item_type in BOTTOM_TYPES:
            slots["bottom"].append(item)
        elif item_type in SHOE_TYPES:
            slots["shoes"].append(item)
        elif item_type in OUTERWEAR_TYPES:
            slots["outerwear"].append(item)
        elif item_type in ACCESSORY_TYPES:
            slots["accessory"].append(item)
        else:
            # Try to guess based on the type name
            if "shirt" in item_type or "top" in item_type:
                slots["top"].append(item)
            elif "pant" in item_type or "jean" in item_type or "short" in item_type:
                slots["bottom"].append(item)
            elif "shoe" in item_type or "sneak" in item_type:
                slots["shoes"].append(item)

    return slots


def _score_combo(top, bottom, shoes=None, accessories=None, target_style="casual"):
    """
    Score an outfit combination based on color contrast, variety, and style match.
    """
    top_color = _get_primary_color(top)
    bottom_color = _get_primary_color(bottom)

    # Base color scoring
    score = _color_contrast_score(top_color, bottom_color)
    
    # Variety penalties
    score += _wear_penalty(top)
    score += _wear_penalty(bottom)

    # Style Match Bonus (CRITICAL)
    if top.get("style", "casual").lower() == target_style.lower():
        score += 40
    elif any(target_style.lower() in tag.lower() for tag in top.get("occasion_tags", [])):
        score += 30

    if bottom.get("style", "casual").lower() == target_style.lower():
        score += 40
    elif any(target_style.lower() in tag.lower() for tag in bottom.get("occasion_tags", [])):
        score += 30

    if shoes:
        shoe_color = _get_primary_color(shoes)
        # Shoes should complement the pants (bottoms)
        score += _color_contrast_score(bottom_color, shoe_color) * 0.4
        score += _wear_penalty(shoes)
        if shoes.get("style", "casual").lower() == target_style.lower():
            score += 20

    if accessories:
        for acc in accessories:
            acc_color = _get_primary_color(acc)
            # Accessories should complement the top or the whole outfit
            score += _color_contrast_score(top_color, acc_color) * 0.2
            score += _wear_penalty(acc)
            if acc.get("style", "casual").lower() == target_style.lower():
                score += 15

    return round(max(0, score))


def _is_weather_appropriate(item, weather_data):
    """
    Check if a clothing item is appropriate for the current weather.
    If no weather data, assume appropriate.
    """
    if not weather_data:
        return True
    
    temp = weather_data.get("temp_c", 20)
    is_raining = weather_data.get("is_raining", False)
    item_type = item.get("type", "unknown").lower()
    
    # Cold Weather (< 15°C)
    if temp < 15:
        # Avoid summer clothes in cold
        if item_type in ["shorts", "sandals", "slippers", "tank_top", "skirt"]:
            return False
            
    # Hot Weather (> 25°C)
    if temp > 25:
        # Avoid heavy winter clothes in heat
        if item_type in ["heavy_coat", "boots", "thermal"]:
            return False
        # Hoodies and sweaters are okay if they are light, but heavily penalized
        if item_type in ["hoodie", "sweater", "jacket"]:
            return False
            
    # Rainy Weather
    if is_raining:
        if item_type in ["suede_shoes", "canvas_shoes", "flip_flops"]:
            return False
            
    return True


def _is_laundry_ready(item):
    """
    Check if an item is clean and hasn't been worn in the last 48 hours.
    """
    # 1. Laundry check
    wear_count = item.get("wear_count", 0)
    threshold = item.get("laundry_threshold", 3)
    
    if wear_count >= threshold:
        return False
        
    # 2. Cool-down check (48 hours)
    last_worn = item.get("last_worn")
    if last_worn:
        # Standard MongoDB datetime object
        if datetime.utcnow() - last_worn < timedelta(hours=48):
            return False
            
    return True

def generate_outfits(clothes, weather_data=None, daily_occasions=None):
    """
    Generate a 7-day outfit plan.
    Works by picking the best scoring combo for each specific day's occasion.
    """
    if not clothes:
        return []

    daily_occasions = daily_occasions or {}

    # Initial filtering by weather AND laundry status
    if weather_data:
        clothes = [item for item in clothes if _is_weather_appropriate(item, weather_data)]
    
    # Only filter by laundry if we have enough clothes left
    clean_clothes = [item for item in clothes if _is_laundry_ready(item)]
    if len(clean_clothes) > 5:
        clothes = clean_clothes

    slots = _group_by_slot(clothes)
    tops = slots["top"]
    bottoms = slots["bottom"]
    shoes_list = slots["shoes"]
    outerwear = slots["outerwear"]
    accessories = slots["accessory"]

    if not tops:
        return []

    if not bottoms:
        top_only_plan = []
        for i, day in enumerate(DAYS):
            top_item = tops[i % len(tops)]
            entry = {
                "top": _serialize_item(top_item),
                "score": max(0, min(100, 50 + _wear_penalty(top_item))),
                "day": day,
                "day_index": i,
                "occasion": daily_occasions.get(day, "Default"),
                "suggested_style": OCCASION_STYLE_MAP.get(daily_occasions.get(day, "Casual"), "casual"),
            }
            if shoes_list:
                entry["shoes"] = _serialize_item(shoes_list[i % len(shoes_list)])
            top_only_plan.append(entry)
        return top_only_plan

    weekly_plan = []
    used_top_ids = []
    used_bottom_ids = []
    used_shoe_ids = []
    used_acc_ids = []

    for i, day in enumerate(DAYS):
        occasion = daily_occasions.get(day)
        target_style = OCCASION_STYLE_MAP.get(occasion or "Casual", "casual")

        day_combos = []
        # Limiting permutations for performance if collection is huge
        sample_tops = random.sample(tops, min(len(tops), 15))
        sample_bottoms = random.sample(bottoms, min(len(bottoms), 15))

        for top in sample_tops:
            for bottom in sample_bottoms:
                # Find best shoes for this top/bottom combo
                best_shoe = None
                best_shoe_score = -1
                for s in shoes_list:
                    s_score = _score_combo(top, bottom, s, None, target_style)
                    if str(s["_id"]) in used_shoe_ids:
                        s_score -= 10
                    if s_score > best_shoe_score:
                        best_shoe_score = s_score
                        best_shoe = s

                # Find best accessory for this combo
                best_acc = None
                if accessories:
                    best_acc_score = -1
                    for acc in accessories:
                        acc_score = _score_combo(top, bottom, best_shoe, [acc], target_style)
                        if str(acc["_id"]) in used_acc_ids:
                            acc_score -= 10
                        if acc_score > best_acc_score:
                            best_acc_score = acc_score
                            best_acc = acc

                variety_penalty = 0
                if str(top["_id"]) in used_top_ids:
                    variety_penalty -= 15
                if str(bottom["_id"]) in used_bottom_ids:
                    variety_penalty -= 15
                
                score = _score_combo(top, bottom, best_shoe, [best_acc] if best_acc else [], target_style) + variety_penalty
                
                day_combos.append({
                    "top": _serialize_item(top),
                    "bottom": _serialize_item(bottom),
                    "shoes": _serialize_item(best_shoe) if best_shoe else None,
                    "accessories": [_serialize_item(best_acc)] if best_acc else [],
                    "score": max(0, min(score, 100)),
                    "day": day,
                    "day_index": i,
                    "occasion": occasion or "Default",
                    "suggested_style": target_style
                })

        # Sort by score for this specific day
        day_combos.sort(key=lambda x: x["score"], reverse=True)
        
        # Pick from top combinations
        top_n = min(3, len(day_combos))
        best_combo = random.choice(day_combos[:top_n])
        
        # Track usage to maximize variety
        used_top_ids.append(best_combo["top"]["_id"])
        used_bottom_ids.append(best_combo["bottom"]["_id"])
        if best_combo["shoes"]:
            used_shoe_ids.append(best_combo["shoes"]["_id"])
        for acc in best_combo["accessories"]:
            used_acc_ids.append(acc["_id"])
        
        # Add random outerwear if cold
        if outerwear and weather_data and weather_data.get("temp_c", 20) < 18:
             best_outerwear = _serialize_item(random.choice(outerwear))
             best_combo["outerwear"] = best_outerwear

        # Generate explanation
        best_combo["explanation"] = _generate_explanation(
            best_combo["top"], 
            best_combo["bottom"], 
            best_combo["shoes"], 
            best_combo.get("outerwear"),
            weather_data, 
            target_style, 
            occasion or "Casual"
        )

        weekly_plan.append(best_combo)

    return weekly_plan

def generate_single_day_outfit(clothes, day, occasion, exclude_ids=None, weather_data=None):
    """
    Generate a fresh outfit for a specific day and occasion.
    `exclude_ids` is a list of item IDs to avoid (e.g. current combo items).
    """
    exclude_ids = exclude_ids or []
    target_style = OCCASION_STYLE_MAP.get(occasion or "Casual", "casual")
    
    # Filter out excluded items if we have plenty of clothes
    if len(clothes) > 5:
        available_clothes = [c for c in clothes if str(c["_id"]) not in exclude_ids]
    else:
        available_clothes = clothes

    if weather_data:
        available_clothes = [item for item in available_clothes if _is_weather_appropriate(item, weather_data)]

    slots = _group_by_slot(available_clothes)
    tops = slots["top"]
    bottoms = slots["bottom"]
    shoes_list = slots["shoes"]
    accessories = slots["accessory"]

    if not tops or not bottoms:
        return None

    combos = []
    # Sample to keep it fast
    sample_tops = random.sample(tops, min(len(tops), 10))
    sample_bottoms = random.sample(bottoms, min(len(bottoms), 10))

    for top in sample_tops:
        for bottom in sample_bottoms:
            # Pick best shoe for this combo
            best_shoe = None
            best_shoe_score = -1
            for s in shoes_list:
                s_score = _score_combo(top, bottom, s, None, target_style)
                if s_score > best_shoe_score:
                    best_shoe_score = s_score
                    best_shoe = s

            # Pick best accessory
            best_acc = None
            if accessories:
                best_acc_score = -1
                for acc in accessories:
                    acc_score = _score_combo(top, bottom, best_shoe, [acc], target_style)
                    if acc_score > best_acc_score:
                        best_acc_score = acc_score
                        best_acc = acc

            score = _score_combo(top, bottom, best_shoe, [best_acc] if best_acc else [], target_style)
            combos.append({
                "top": _serialize_item(top),
                "bottom": _serialize_item(bottom),
                "shoes": _serialize_item(best_shoe) if best_shoe else None,
                "accessories": [_serialize_item(best_acc)] if best_acc else [],
                "score": score,
                "day": day,
                "occasion": occasion,
                "suggested_style": target_style
            })

    combos.sort(key=lambda x: x["score"], reverse=True)
    
    # Pick a random one from top 5 for freshness
    res = None
    if len(combos) > 0:
        res = random.choice(combos[:min(5, len(combos))])

    if res:
        # Generate explanation for single day
        res["explanation"] = _generate_explanation(
            res["top"], 
            res["bottom"], 
            res["shoes"], 
            res.get("outerwear"),
            weather_data, 
            target_style, 
            occasion or "Casual"
        )
    
    return res


def confirm_worn_outfit(user_id, item_ids):
    """
    Mark specific item IDs as worn for a user.
    """
    try:
        import app.config.db as db
        from bson import ObjectId
        
        # Convert string IDs to ObjectIds
        obj_ids = [ObjectId(tid) for tid in item_ids]
        
        db.clothes_collection.update_many(
            {"_id": {"$in": obj_ids}, "user_id": user_id},
            {"$inc": {"wear_count": 1}, "$set": {"last_worn": datetime.utcnow()}}
        )
        return {"success": True, "message": "Outfit marked as worn"}
    except Exception as e:
        return {"error": str(e)}
