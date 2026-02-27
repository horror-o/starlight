# AI Agent Guidelines for Starlight

## Project Overview
Starlight is a mobile application for the Yu-Gi-Oh! TCG. Its primary features are:
1. **Collection Tracker:** A database entry system for users to log the physical cards they own.
2. **Deck Builder:** Tools for creating, editing, and validating legal decks.
3. **Set & Pull Database:** A reference tool for users to discover which sets, booster boxes, or products contain specific cards.

## Tech Stack & Architecture
* **Framework:** React Native managed by Expo.
* **Language:** TypeScript (`tsconfig.json` is present; enforce strict typing for all new components and database schemas).
* **Directory Structure:**
  * `src/`: Core application logic, divided into `screens/`, `components/`, `navigation/`, and `utils/`.
  * `assets/`: Static resources, including high-resolution card artwork, set symbols, and UI icons.

## Coding Standards
* Strictly use functional components and React Hooks. Do not use Class components.
* Write clean, modular TypeScript interfaces for all data models (e.g., `Card`, `Set`, `Deck`, `CollectionEntry`).
* Prioritize performance for list rendering. When displaying large databases of cards or search results, utilize `FlatList` or `@shopify/flash-list`.

## Database & Performance
* **Local Storage:** The card database is massive (13,000+ entries). Do not store the entire card pool in memory or standard React state variables.
* **SQLite:** Default to using `expo-sqlite` for storing and querying the core card database locally on the device.
* **Pagination:** Whenever querying the database to display a list of cards or sets, always implement pagination or infinite scrolling.

## Data Sourcing & IP Protection
* **Card Assets (API Only):** All card data, text, and individual card artwork must be fetched exclusively via our designated third-party community API. Do not write scripts to scrape official Konami web servers.
* **Strict UI/UX IP Guardrail:** Do NOT use, import, or generate any official Konami assets for the app's user interface. This means absolutely no official Yu-Gi-Oh! logos, anime character background art, official card backing images, or copyrighted UI themes.
* **Original/Generic Design:** For app backgrounds, icons, and structural design, stick to original, generic, or open-source stylized assets. Lean into a clean, modern aesthetic that fits the "Starlight" name rather than copying official game clients.

## Storage & Asset Optimization (The Hybrid Offline Approach)
* **Text Data (Offline):** The core card database (stats, text, sets) must be stored locally via `expo-sqlite`. This ensures instantaneous, offline search and deck building.
* **Image Data (Lazy & Cached):** Do NOT bundle card artwork into the app. Card images must be fetched from the API on-demand.
* **Caching Library:** Use `expo-image` (or a similar optimized caching library) to render card images. Once an image is fetched, it should be aggressively cached locally so it loads instantly (and offline) the next time the user views it.
* **Thumbnails vs. Full Res:** When rendering lists or deck grids, always request the thumbnail/small version of the card image from the API. Only load high-resolution images when the user navigates to a single card's detail screen.

## UI / UX Considerations
* **Card Text Rendering:** Monster effects and Pendulum effects can be extremely lengthy. UI components displaying card text must use `ScrollView` to prevent text from being cut off on smaller screens.
* **Dynamic Styling:** Implement distinct visual indicators (colors or icons) for different card types (e.g., purple for Fusion, white for Synchro, black for Xyz, dark blue for Link, green for Spell, pink for Trap).

## Database & Performance
* **Local Storage:** The card database is massive (13,000+ entries). Do not store the entire card pool in memory or standard React state variables.
* **SQLite:** Default to using `expo-sqlite` for storing and querying the core card database locally on the device.
* **Pagination:** Whenever querying the database to display a list of cards or sets, always implement pagination or infinite scrolling.

## Domain Logic: Yu-Gi-Oh! TCG Data Models
When designing schemas or writing logic, adhere to these domain-specific rules:

### 1. The Deck Builder
* **Main Deck:** Must enforce a minimum of 40 cards and a maximum of 60 cards.
* **Extra Deck:** Maximum of 15 cards. Only Fusion, Synchro, Xyz, and Link monsters belong here. (For example, if testing the builder with a D/D/D deck, ensure D/D/D Flame King Genghis goes to the Extra Deck, while D/D Savant Kepler stays in the Main Deck).
* **Side Deck:** Maximum of 15 cards.
* **Card Limit:** A user cannot add more than 3 copies of any card with the same name to a deck (Main, Extra, and Side combined), subject to the Forbidden & Limited List.

### 2. The Database & Set Tracking
* **Card Entities:** Every card needs base properties (Name, Attribute, Level/Rank/Link Rating, Type, Text, ATK/DEF).
* **Print Entities (The "Pull" System):** A single "Card" can have multiple "Prints". Each print belongs to a specific "Set" or "Box".
* **Set Properties:** Sets must be trackable by their Set Code (e.g., LOB, DUDE, POTE), Rarity, and Product Type (Booster Box, Structure Deck, Tin).
* **Collection Tracking:** The user's collection should map to specific *Prints*, not just base cards, so users know exactly which version and rarity of a card they own.


