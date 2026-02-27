import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BANLIST_KEY = 'tcg_banlist_data';
const BANLIST_VERSION_KEY = 'tcg_banlist_version';
const CHECK_DB_VER_URL = 'https://db.ygoprodeck.com/api/v7/checkDBVer.php';
const BANLIST_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=tcg';

export type BanStatus = 'Forbidden' | 'Limited' | 'Semi-Limited' | 'Unlimited';

export interface SimplifiedBanlistCard {
  id: number;
  name: string;
  banStatus: BanStatus;
}

interface BanlistInfo {
  ban_tcg?: string;
}

interface ApiCard {
  id: number;
  name: string;
  banlist_info?: BanlistInfo;
}

export const fetchBanlist = async (): Promise<SimplifiedBanlistCard[]> => {
  try {
    // 1. Check DB Version
    const versionResponse = await axios.get(CHECK_DB_VER_URL);
    const remoteVersion = versionResponse.data[0].database_version;
    const localVersion = await AsyncStorage.getItem(BANLIST_VERSION_KEY);

    let banlistData: SimplifiedBanlistCard[] = [];

    // 2. Load local if version matches
    if (localVersion === remoteVersion) {
      const storedData = await AsyncStorage.getItem(BANLIST_KEY);
      if (storedData) {
        console.log('Using cached banlist');
        return JSON.parse(storedData);
      }
    }

    // 3. Fetch full banlist if needed
    console.log('Fetching new banlist');
    const response = await axios.get(BANLIST_URL);
    const cards: ApiCard[] = response.data.data;

    banlistData = cards
      .filter((card) => card.banlist_info?.ban_tcg)
      .map((card) => {
        let status: BanStatus = 'Unlimited';
        const banTcg = card.banlist_info?.ban_tcg;

        if (banTcg === 'Banned' || banTcg === 'Forbidden') {
          status = 'Forbidden';
        } else if (banTcg === 'Limited') {
          status = 'Limited';
        } else if (banTcg === 'Semi-Limited') {
          status = 'Semi-Limited';
        }

        return {
          id: card.id,
          name: card.name,
          banStatus: status,
        };
      });

    // 4. Store Data
    await AsyncStorage.setItem(BANLIST_KEY, JSON.stringify(banlistData));
    await AsyncStorage.setItem(BANLIST_VERSION_KEY, remoteVersion);

    return banlistData;
  } catch (error) {
    console.error('Error fetching banlist:', error);
    // Try to fallback to cached data if fetch failed
    const storedData = await AsyncStorage.getItem(BANLIST_KEY);
    if (storedData) {
        return JSON.parse(storedData);
    }
    return [];
  }
};

export const getBanlist = async (): Promise<SimplifiedBanlistCard[]> => {
    // Helper to just get the list (maybe cached in memory in real app, but here we read storage)
    // Actually, fetchBanlist handles the cache logic, so we can just call it.
    // But we might want a lightweight 'read only' without network check for rapid calls?
    // For now, adhering to 'sync' logic, we use fetchBanlist.
    // Optimization: In a real app, we'd sync once on startup and keep in memory.
    return fetchBanlist();
};
