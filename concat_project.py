import os

# Extensions to include
INCLUDE_EXTENSIONS = {
    ".py", ".txt", ".md", ".jsx", ".js", ".ts", ".tsx",
    ".css", ".html", ".json", ".yml", ".yaml"
}

# Folders to ignore
IGNORE_DIRS = {
    ".git", "node_modules", "__pycache__", "dist", "build", ".venv", "venv"
}

def should_include(file):
    return os.path.splitext(file)[1].lower() in INCLUDE_EXTENSIONS


def walk_directory(base_path):
    structure = []

    for root, dirs, files in os.walk(base_path):
        # Remove ignored dirs
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        level = root.replace(base_path, "").count(os.sep)
        indent = "    " * level
        folder_name = os.path.basename(root) if level > 0 else os.path.basename(base_path)

        structure.append(f"{indent}[{folder_name}/]")

        sub_indent = "    " * (level + 1)

        for file in files:
            if should_include(file):
                file_path = os.path.join(root, file)
                structure.append(f"{sub_indent}{file} ->")

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                except Exception as e:
                    content = f"[ERROR READING FILE: {e}]"

                # Indent file content
                content_lines = content.splitlines()
                for line in content_lines:
                    structure.append(f"{sub_indent}    {line}")

                structure.append("")  # spacing

    return "\n".join(structure)


def main():
    base_path = os.getcwd()
    project_name = os.path.basename(base_path)

    output_file = f"{project_name}.txt"

    print(f"Scanning project: {project_name}...")

    result = walk_directory(base_path)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(result)

    print(f"✅ Done! Output saved to: {output_file}")


if __name__ == "__main__":
    main()