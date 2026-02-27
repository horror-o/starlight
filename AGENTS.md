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
