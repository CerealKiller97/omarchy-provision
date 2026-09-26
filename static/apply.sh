#!/usr/bin/env bash
#
# Applies an omarchy.yml made with Omarchy Provision through Omarchy's own CLI.
#
# Download omarchy.yml from the site, then run this one command on your Omarchy machine:
#
#   bash <(curl -fsSL https://<site>/apply.sh)
#
# It picks up omarchy.yml from the current directory or ~/Downloads. To use another file:
#
#   bash <(curl -fsSL https://<site>/apply.sh) path/to/omarchy.yml
#
# Optionally ranks mirrors and updates the system first, then applies the theme, plugins,
# preinstall/app/web-app removal, pacman/AUR packages, services, dev environments, web app and
# TUI launchers, and defaults. Each item is best-effort, so one
# failure does not abort the rest. Must run on a real Omarchy install (needs the `omarchy` CLI).
#
# Run it with `bash <(curl …)` rather than `curl … | bash`: the installers it calls may prompt,
# and with a pipe they would read the rest of this script as their input.

set -eo pipefail

# Visual ANSI Color Definitions
RESTORE='\033[0m'
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

#######################################
# Prints a blue [INFO] tag followed by a cyan message.
# Arguments:
#   $1 - message text.
#######################################
log_info() {
    echo -e "${BLUE}${BOLD}[INFO]${RESTORE} ${CYAN}$1${RESTORE}"
}

#######################################
# Prints a bold yellow step heading preceded by a blank line.
# Arguments:
#   $1 - heading text.
#######################################
log_step() {
    echo -e "\n${YELLOW}${BOLD}===> $1${RESTORE}"
}

#######################################
# Prints a green [SUCCESS] tag followed by a message.
# Arguments:
#   $1 - message text.
#######################################
log_success() {
    echo -e "${GREEN}${BOLD}[SUCCESS]${RESTORE} $1"
}

#######################################
# Prints a red [ERROR] tag followed by a message to stderr.
# Arguments:
#   $1 - message text.
#######################################
log_error() {
    echo -e "${RED}${BOLD}[ERROR]${RESTORE} $1" >&2
}

trap 'log_error "Config apply failed at line $LINENO. Exiting."; exit 1' ERR

#######################################
# Prints the omarchy.yml to apply: the path given as an argument (or in
# OMARCHY_CONFIG), else ./omarchy.yml, else ~/Downloads/omarchy.yml.
# Arguments:
#   $1 - optional explicit path.
# Returns:
#   1 when no config file is found.
#######################################
resolve_config() {
    local explicit="${1:-${OMARCHY_CONFIG:-}}" candidate
    if [[ -n "$explicit" ]]; then
        [[ -f "$explicit" ]] && { echo "$explicit"; return; }
        log_error "Config not found: $explicit"
        return 1
    fi
    for candidate in "$PWD/omarchy.yml" "$HOME/Downloads/omarchy.yml"; do
        [[ -f "$candidate" ]] && { echo "$candidate"; return; }
    done
    log_error "No omarchy.yml in $PWD or ~/Downloads. Download it from the site, or pass its path: bash <(curl -fsSL …/apply.sh) path/to/omarchy.yml"
    return 1
}

case "${1:-}" in
    -h | --help)
        cat <<'USAGE'
Applies an omarchy.yml made with Omarchy Provision through the omarchy CLI.

Usage: bash <(curl -fsSL <site>/apply.sh) [path/to/omarchy.yml]

Without a path it uses ./omarchy.yml, then ~/Downloads/omarchy.yml
(OMARCHY_CONFIG=/path/to/omarchy.yml works too).
USAGE
        exit 0
        ;;
esac

CONFIG_FILE="$(resolve_config "${1:-}")" || exit 1
command -v omarchy >/dev/null 2>&1 || { log_error "omarchy CLI not found; this script must run on an Omarchy install."; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
# Minimal YAML helpers — tailored to omarchy.yml's flat schema (scalars and
# single-level "- item" lists under a top-level key), not general-purpose.
# ─────────────────────────────────────────────────────────────────────────────

#######################################
# Prints the value of the first 'key: value' line in omarchy.yml, without
# trailing comments; empty when the key is missing.
# Arguments:
#   $1 - key name.
#######################################
yaml_value() {
    local key="$1"
    { grep -m1 -E "^[[:space:]]*${key}:" "$CONFIG_FILE" || true; } \
        | sed -E "s/^[[:space:]]*${key}:[[:space:]]*//" \
        | sed 's/#.*//' \
        | xargs
}

#######################################
# Prints the items of a top-level '<header>:' list in omarchy.yml, one per line.
# Strips '- ' markers, comments and blank items.
# Arguments:
#   $1 - list header name.
#######################################
yaml_list() {
    local header="$1" line
    awk -v header="^${header}:\$" '
        $0 ~ header { found=1; next }
        found && /^[^[:space:]]/ { exit }
        found { print }
    ' "$CONFIG_FILE" | while IFS= read -r line; do
        [[ "$line" =~ ^[[:space:]]*-[[:space:]] ]] || continue
        line="${line#*- }"
        line="${line%%#*}"
        line="$(echo "$line" | xargs)"
        if [[ -n "$line" ]]; then echo "$line"; fi
    done
}

# Installed themes live at ~/.config/omarchy/themes/<name>, used below to skip
# a re-install if the theme is already present.
THEMES_DIR="$HOME/.config/omarchy/themes"

#######################################
# Optionally ranks pacman mirrors with reflector (update_pacman_mirrors) and
# runs a full `omarchy update -y` (initial_system_update) before anything else.
#######################################
apply_system() {
    log_step "Preparing the system"
    if [[ "$(yaml_value update_pacman_mirrors)" == "true" ]]; then
        if ! command -v reflector >/dev/null 2>&1; then
            log_info "omarchy pkg add reflector"
            omarchy pkg add reflector || log_error "Failed to install reflector."
        fi
        if command -v reflector >/dev/null 2>&1; then
            log_info "Ranking pacman mirrors (backup: /etc/pacman.d/mirrorlist.bak)"
            sudo cp -f /etc/pacman.d/mirrorlist /etc/pacman.d/mirrorlist.bak \
                && sudo reflector --protocol https --latest 20 --sort rate --save /etc/pacman.d/mirrorlist \
                || log_error "reflector failed; keeping the current mirrorlist."
        fi
    fi
    if [[ "$(yaml_value initial_system_update)" == "true" ]]; then
        log_info "omarchy update -y"
        omarchy update -y || log_error "System update failed; continuing."
    fi
    log_success "System prepared."
}

#######################################
# Sets a built-in theme, or installs a theme from its repo URL (unless present),
# then sets its background image.
#######################################
apply_theme() {
    log_step "Installing & applying theme"
    local url name bg theme_dir
    url="$(yaml_value url)"
    name="$(yaml_value name)"
    bg="$(yaml_value background_image)"

    if [[ -z "$url" ]]; then
        if [[ -n "$name" ]]; then
            log_info "omarchy theme set $name"
            omarchy theme set "$name" || log_error "Failed to set built-in theme '$name'."
            return
        fi
        log_info "No theme in omarchy.yml; skipping."
        return
    fi

    theme_dir="$THEMES_DIR/$name"
    if [[ -n "$name" && -d "$theme_dir" ]]; then
        log_info "Theme '$name' already installed at $theme_dir; skipping install."
    else
        if ! command -v omarchy-theme-install >/dev/null 2>&1; then
            log_error "omarchy-theme-install not found; skipping theme."
            return
        fi
        log_info "omarchy-theme-install $url"
        omarchy-theme-install "$url" || { log_error "Theme install failed for '$url'."; return; }
    fi

    if [[ -n "$bg" ]]; then
        local bg_path="$theme_dir/backgrounds/$bg"
        if [[ -f "$bg_path" ]]; then
            log_info "omarchy theme bg set $bg_path"
            omarchy theme bg set "$bg_path" || log_error "Failed to set background '$bg_path'."
        else
            log_error "Background image not found at $bg_path; skipping 'omarchy theme bg set'."
        fi
    fi
    log_success "Theme '${name:-$url}' applied."
}

#######################################
# Sets the Omarchy default browser, agent, terminal and editor.
#######################################
apply_defaults() {
    log_step "Setting Omarchy defaults"
    local key value
    for key in browser agent terminal editor; do
        value="$(yaml_value "$key")"
        [[ -n "$value" ]] || continue
        # A default is only usable once installed; terminals are set as the
        # default by `omarchy install terminal` itself.
        case "$key" in
            browser)
                log_info "omarchy install browser $value"
                omarchy install browser "$value" || log_error "Failed to install browser '$value'."
                ;;
            terminal)
                log_info "omarchy install terminal $value"
                omarchy install terminal "$value" || log_error "Failed to install terminal '$value'."
                continue
                ;;
        esac
        log_info "omarchy default $key $value"
        omarchy default "$key" "$value" || log_error "Failed to set default $key=$value."
    done
    log_success "Defaults applied."
}

#######################################
# Adds and enables every plugin listed under plugins.
#######################################
apply_plugins() {
    log_step "Installing plugins"
    local url
    while IFS= read -r url; do
        [[ -n "$url" ]] || continue
        log_info "omarchy plugin add $url --enable --yes"
        omarchy plugin add "$url" --enable --yes \
            || log_error "Plugin '$url' failed to install; skipping."
    done < <(yaml_list plugins)
    log_success "Plugins processed."
}

#######################################
# Applies the `preinstalls` mode: `all` runs `omarchy remove preinstalls`;
# `keep` (or unset) and `some` leave that command alone (`some` is handled by
# the remove_apps / remove_web_apps / remove_tuis lists).
#######################################
apply_remove_preinstalls() {
    log_step "Preinstalled apps"
    local mode
    mode="$(yaml_value preinstalls)"
    case "${mode:-keep}" in
        all)
            log_info "omarchy remove preinstalls"
            omarchy remove preinstalls || log_error "Failed to remove preinstalls."
            log_success "Preinstalls removed."
            ;;
        keep | some)
            log_info "preinstalls is '${mode:-keep}'; not removing everything."
            ;;
        *)
            log_error "Unknown preinstalls value '$mode' (expected keep, all or some); skipping."
            ;;
    esac
}

#######################################
# Removes each app listed under remove_apps with `omarchy pkg drop`.
#######################################
apply_remove_apps() {
    log_step "Removing apps"
    local app
    while IFS= read -r app; do
        [[ -n "$app" ]] || continue
        log_info "omarchy pkg drop $app"
        omarchy pkg drop "$app" || log_error "Failed to remove '$app'; skipping."
    done < <(yaml_list remove_apps)
    log_success "App removal processed."
}

#######################################
# Removes each web app listed under remove_web_apps.
#######################################
apply_remove_web_apps() {
    log_step "Removing web apps"
    local app
    while IFS= read -r app; do
        [[ -n "$app" ]] || continue
        log_info "omarchy webapp remove $app"
        omarchy webapp remove "$app" || log_error "Failed to remove web app '$app'; skipping."
    done < <(yaml_list remove_web_apps)
    log_success "Web app removal processed."
}

#######################################
# Removes each TUI launcher listed under remove_tuis.
#######################################
apply_remove_tuis() {
    log_step "Removing TUI launchers"
    local name
    while IFS= read -r name; do
        [[ -n "$name" ]] || continue
        log_info "omarchy tui remove $name"
        omarchy tui remove "$name" || log_error "Failed to remove TUI '$name'; skipping."
    done < <(yaml_list remove_tuis)
    log_success "TUI removal processed."
}

#######################################
# Installs each package listed under pacman_packages with `omarchy pkg add`.
#######################################
apply_pacman_packages() {
    log_step "Installing pacman packages"
    local pkg
    while IFS= read -r pkg; do
        [[ -n "$pkg" ]] || continue
        log_info "omarchy pkg add $pkg"
        omarchy pkg add "$pkg" || log_error "Failed to install '$pkg'; skipping."
    done < <(yaml_list pacman_packages)
    log_success "pacman_packages processed."
}

#######################################
# Installs each package listed under aur_packages with `omarchy pkg aur add`.
#######################################
apply_aur_packages() {
    log_step "Installing AUR packages"
    local pkg
    while IFS= read -r pkg; do
        [[ -n "$pkg" ]] || continue
        log_info "omarchy pkg aur add $pkg"
        omarchy pkg aur add "$pkg" || log_error "Failed to install '$pkg'; skipping."
    done < <(yaml_list aur_packages)
    log_success "aur_packages processed."
}

#######################################
# Installs each Omarchy service listed under install_services.
#######################################
apply_install_services() {
    log_step "Installing services"
    local service
    while IFS= read -r service; do
        [[ -n "$service" ]] || continue
        log_info "omarchy install service $service"
        omarchy install service "$service" || log_error "Failed to install service '$service'; skipping."
    done < <(yaml_list install_services)
    log_success "Services processed."
}

#######################################
# Installs each development environment listed under install_dev_envs.
#######################################
apply_install_dev_envs() {
    log_step "Installing dev environments"
    local env
    while IFS= read -r env; do
        [[ -n "$env" ]] || continue
        log_info "omarchy install dev-env $env"
        omarchy install dev-env "$env" || log_error "Failed to install dev-env '$env'; skipping."
    done < <(yaml_list install_dev_envs)
    log_success "Dev environments processed."
}

#######################################
# Creates a web app launcher for each 'name|url|icon' line under webapps.
# An empty icon is passed through as "", which makes omarchy fetch the
# site's own icon.
#######################################
apply_webapps() {
    log_step "Creating web apps"
    local line name url icon
    while IFS= read -r line; do
        [[ -n "$line" ]] || continue
        IFS='|' read -r name url icon <<< "$line"
        if [[ -z "$name" || -z "$url" ]]; then
            log_error "Invalid webapps entry '$line' (want name|url|icon); skipping."
            continue
        fi
        log_info "omarchy webapp install $name $url ${icon:-(site icon)}"
        omarchy webapp install "$name" "$url" "$icon" || log_error "Failed to create web app '$name'; skipping."
    done < <(yaml_list webapps)
    log_success "Web apps processed."
}

#######################################
# Creates a TUI launcher for each 'name|command|style|icon' line under tuis.
#######################################
apply_tuis() {
    log_step "Creating TUI launchers"
    local line name cmd style icon
    while IFS= read -r line; do
        [[ -n "$line" ]] || continue
        IFS='|' read -r name cmd style icon <<< "$line"
        if [[ -z "$name" || -z "$cmd" || -z "$style" || -z "$icon" ]]; then
            log_error "Invalid tuis entry '$line' (want name|command|float-or-tile|icon); skipping."
            continue
        fi
        log_info "omarchy tui install $name $cmd $style $icon"
        omarchy tui install "$name" "$cmd" "$style" "$icon" || log_error "Failed to create TUI '$name'; skipping."
    done < <(yaml_list tuis)
    log_success "TUI launchers processed."
}

#######################################
# Applies every section of omarchy.yml.
#######################################
main() {
    log_info "Applying $CONFIG_FILE"

    apply_system
    apply_theme
    apply_plugins
    apply_remove_preinstalls
    apply_remove_apps
    apply_remove_web_apps
    apply_remove_tuis
    apply_pacman_packages
    apply_aur_packages
    apply_install_services
    apply_install_dev_envs
    apply_webapps
    apply_tuis
    apply_defaults

    echo -e "\n${GREEN}${BOLD}====================================================${RESTORE}"
    echo -e "${GREEN}${BOLD}     omarchy.yml applied via the Omarchy CLI!       ${RESTORE}"
    echo -e "${GREEN}${BOLD}====================================================${RESTORE}\n"
}

main "$@"
