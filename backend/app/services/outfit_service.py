import random


def group_clothes_by_type(clothes):

    grouped = {
        "shirt": [],
        "pants": [],
        "shoes": []
    }

    for item in clothes:

        if item["type"] in grouped:
            grouped[item["type"]].append(item)

    return grouped


def color_score(colors1, colors2):

    score = 0

    for c1 in colors1:
        for c2 in colors2:

            diff = abs(c1[0]-c2[0]) + abs(c1[1]-c2[1]) + abs(c1[2]-c2[2])

            if diff < 200:
                score += 10

    return score


def score_outfit(shirt, pants, shoes):

    score = 0

    score += color_score(shirt["colors"], pants["colors"])

    score += color_score(shirt["colors"], shoes["colors"])

    score += color_score(pants["colors"], shoes["colors"])

    return score


def generate_outfits(clothes):

    grouped = group_clothes_by_type(clothes)

    outfits = []

    for shirt in grouped["shirt"]:
        for pants in grouped["pants"]:
            for shoes in grouped["shoes"]:

                score = score_outfit(shirt, pants, shoes)

                outfit = {
                    "shirt": str(shirt["_id"]),
                    "pants": str(pants["_id"]),
                    "shoes": str(shoes["_id"]),
                    "score": score
                }

                outfits.append(outfit)

    outfits.sort(key=lambda x: x["score"], reverse=True)

    return outfits[:10]
