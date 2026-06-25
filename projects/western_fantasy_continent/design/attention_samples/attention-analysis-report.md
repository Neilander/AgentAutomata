# Attention Analysis Report

This is a first rough pass. Scores are not calibrated facts; they test whether the formula roughly matches human intuition.

## Steam homepage

- Intent: `browse_store_recommendation`
- Expected top clusters: hero_art, game_detail, search_tools
- Predicted top clusters: hero_art, game_detail, search_tools
- Top-3 overlap: 3/3

| Cluster | Attention | Status | Top signal |
| --- | ---: | --- | --- |
| hero_art | 72.5 | too_high | hero_image (72.5) |
| game_detail | 26.3 | ok | game_title (12.7) |
| search_tools | 1.2 | too_low | search_box (0.9) |

Issues:
- hero_art above maximum attention (72.5)
- search_tools below minimum attention (1.2)

## itch.io free games list

- Intent: `browse_game_list`
- Expected top clusters: game_grid, sort_filter, promo_banner
- Predicted top clusters: promo_banner, sort_filter, game_grid
- Top-3 overlap: 3/3

| Cluster | Attention | Status | Top signal |
| --- | ---: | --- | --- |
| promo_banner | 43.8 | too_high | promo_banner_visual (43.8) |
| sort_filter | 30.4 | ok | page_title (17.6) |
| game_grid | 15.7 | too_low | card_1 (4.5) |
| side_filters | 10.1 | ok | price_filter (6.6) |

Issues:
- promo_banner above maximum attention (43.8)
- game_grid below minimum attention (15.7)

## Sudoku puzzle page

- Intent: `solve_puzzle`
- Expected top clusters: puzzle_board, number_controls, cookie_banner
- Predicted top clusters: puzzle_board, cookie_banner, number_controls
- Top-3 overlap: 3/3

| Cluster | Attention | Status | Top signal |
| --- | ---: | --- | --- |
| puzzle_board | 56.0 | too_high | board_grid (31.8) |
| cookie_banner | 20.1 | too_high | cookie_panel (12.3) |
| number_controls | 18.6 | ok | number_pad (11.4) |
| app_ad | 5.3 | ok | download_ad (5.3) |

Issues:
- puzzle_board above maximum attention (56.0)
- cookie_banner above maximum attention (20.1)

## 4v4 genre arena

- Intent: `watch_and_compare_battle`
- Expected top clusters: battle_window, preset_dock, top_controls
- Predicted top clusters: battle_window, preset_dock, top_controls
- Top-3 overlap: 3/3

| Cluster | Attention | Status | Top signal |
| --- | ---: | --- | --- |
| battle_window | 91.8 | too_high | battlefield_area (65.3) |
| preset_dock | 5.2 | too_low | selected_preset_highlight (2.7) |
| top_controls | 2.4 | too_low | page_title (1.0) |
| team_config | 0.5 | ok | left_config (0.3) |
| debug_bottom | 0.2 | ok | combat_log (0.1) |

Issues:
- battle_window above maximum attention (91.8)
- preset_dock below minimum attention (5.2)
- top_controls below minimum attention (2.4)
