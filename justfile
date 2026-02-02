set shell := ["bash", "-cu"]

# Directories
markdown_dir := "./resumes/markdown"
output_dir := "./resumes/generated"

# Default recipe: show help
default:
    @just --list

# Install dependencies
install:
    npm install

# Ensure output directory exists
[private]
ensure-dirs:
    @mkdir -p {{output_dir}}

# Convert a markdown file to PDF (with fuzzy file selection if no input provided)
convert input="": ensure-dirs
    #!/usr/bin/env bash
    input="{{input}}"
    if [[ -z "$input" ]]; then
        file=$(find {{markdown_dir}} -name "*.md" | fzf --prompt="Select markdown file: " --preview="head -50 {}")
        if [[ -n "$file" ]]; then
            basename="${file##*/}"
            output="{{output_dir}}/${basename%.md}.pdf"
            npx tsx src/cli.ts "$file" -o "$output"
        fi
    else
        basename="${input##*/}"
        output="{{output_dir}}/${basename%.md}.pdf"
        npx tsx src/cli.ts "$input" -o "$output"
    fi

# Convert markdown to PDF and HTML (for debugging)
convert-debug input="": ensure-dirs
    #!/usr/bin/env bash
    input="{{input}}"
    if [[ -z "$input" ]]; then
        file=$(find {{markdown_dir}} -name "*.md" 2>/dev/null | fzf --prompt="Select markdown file: " --preview="head -50 {}" < /dev/tty)
        if [[ -n "$file" ]]; then
            basename="${file##*/}"
            output_pdf="{{output_dir}}/${basename%.md}.pdf"
            output_html="{{output_dir}}/${basename%.md}.html"
            npx tsx src/cli.ts "$file" -o "$output_pdf" --html "$output_html"
        fi
    else
        basename="${input##*/}"
        output_pdf="{{output_dir}}/${basename%.md}.pdf"
        output_html="{{output_dir}}/${basename%.md}.html"
        npx tsx src/cli.ts "$input" -o "$output_pdf" --html "$output_html"
    fi

# Convert all markdown files in the resumes directory
all: ensure-dirs
    #!/usr/bin/env bash
    for file in {{markdown_dir}}/*.md; do
        if [ -f "$file" ]; then
            basename="${file##*/}"
            output="{{output_dir}}/${basename%.md}.pdf"
            echo "Converting $file -> $output"
            npx tsx src/cli.ts "$file" -o "$output"
        fi
    done

# Convert the sample resume
sample: ensure-dirs
    npx tsx src/cli.ts {{markdown_dir}}/sample.md -o {{output_dir}}/sample.pdf --html {{output_dir}}/sample.html

# Build TypeScript to JavaScript
build:
    npx tsc

# Clean generated files
clean:
    rm -rf dist/
    rm -f {{output_dir}}/*.pdf {{output_dir}}/*.html

# Watch mode for development (with fuzzy selection)
dev input="": ensure-dirs
    #!/usr/bin/env bash
    input="{{input}}"
    if [[ -z "$input" ]]; then
        file=$(find {{markdown_dir}} -name "*.md" | fzf --prompt="Select file to watch: ")
        [[ -z "$file" ]] && exit 0
    else
        file="$input"
    fi
    basename="${file##*/}"
    output_pdf="{{output_dir}}/${basename%.md}.pdf"
    output_html="{{output_dir}}/${basename%.md}.html"
    echo "Watching $file for changes..."
    watchexec -w "${file}" npx tsx src/cli.ts "$file" -o "$output_pdf" --html "$output_html"


