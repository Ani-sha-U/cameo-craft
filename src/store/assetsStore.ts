import { create } from 'zustand';
import { toast } from 'sonner';

export type AssetCategory = 'characters' | 'props' | 'effects' | 'textures' | 'stickers' | 'custom';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  imageUrl: string;
  thumbnail?: string;
  isCustom?: boolean;
}

interface AssetsStore {
  assets: Asset[];
  selectedCategory: AssetCategory;
  customAssets: Asset[];
  
  setSelectedCategory: (category: AssetCategory) => void;
  addCustomAsset: (file: File) => Promise<void>;
  removeCustomAsset: (id: string) => void;
  getAssetsByCategory: (category: AssetCategory) => Asset[];
}

// Default asset library
const DEFAULT_ASSETS: Asset[] = [
  // Characters
  {
    id: 'char-1',
    name: 'Robot',
    category: 'characters',
    imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=400&h=400&fit=crop',
  },
  {
    id: 'char-2',
    name: 'Astronaut',
    category: 'characters',
    imageUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop',
  },
  {
    id: 'char-3',
    name: 'Superhero',
    category: 'characters',
    imageUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=400&fit=crop',
  },
  
  // Props
  {
    id: 'prop-1',
    name: 'Laptop',
    category: 'props',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
  },
  {
    id: 'prop-2',
    name: 'Coffee Cup',
    category: 'props',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
  },
  {
    id: 'prop-3',
    name: 'Plant',
    category: 'props',
    imageUrl: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop',
  },
  
  // Effects
  {
    id: 'effect-1',
    name: 'Smoke',
    category: 'effects',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=400&fit=crop',
  },
  {
    id: 'effect-2',
    name: 'Fire',
    category: 'effects',
    imageUrl: 'https://images.unsplash.com/photo-1525183995014-bd94c0750cd5?w=400&h=400&fit=crop',
  },
  {
    id: 'effect-3',
    name: 'Neon Glow',
    category: 'effects',
    imageUrl: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?w=400&h=400&fit=crop',
  },
  {
    id: 'effect-4',
    name: 'Particles',
    category: 'effects',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
  },
  
  // Textures
  {
    id: 'texture-1',
    name: 'Wood',
    category: 'textures',
    imageUrl: 'https://images.unsplash.com/photo-1524075864097-ae6d68b6a73d?w=400&h=400&fit=crop',
  },
  {
    id: 'texture-2',
    name: 'Marble',
    category: 'textures',
    imageUrl: 'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=400&h=400&fit=crop',
  },
  {
    id: 'texture-3',
    name: 'Fabric',
    category: 'textures',
    imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=400&h=400&fit=crop',
  },
  
  // Stickers
  {
    id: 'sticker-1',
    name: 'Star',
    category: 'stickers',
    imageUrl: 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?w=400&h=400&fit=crop',
  },
  {
    id: 'sticker-2',
    name: 'Heart',
    category: 'stickers',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop',
  },
  {
    id: 'sticker-3',
    name: 'Lightning',
    category: 'stickers',
    imageUrl: 'https://images.unsplash.com/photo-1561622183-9c6dfd6e5ff7?w=400&h=400&fit=crop',
  },
];

export const useAssetsStore = create<AssetsStore>((set, get) => ({
  assets: DEFAULT_ASSETS,
  selectedCategory: 'characters',
  customAssets: [],
  
  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },
  
  addCustomAsset: async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, SVG, JPG, or WebP.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }
    
    try {
      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      
      const newAsset: Asset = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        category: 'custom',
        imageUrl,
        isCustom: true,
      };
      
      set((state) => ({
        customAssets: [...state.customAssets, newAsset],
        assets: [...state.assets, newAsset],
      }));
      
      toast.success(`Added ${newAsset.name} to your assets`);
    } catch (error) {
      console.error('Error adding custom asset:', error);
      toast.error('Failed to add asset');
    }
  },
  
  removeCustomAsset: (id: string) => {
    const asset = get().customAssets.find(a => a.id === id);
    
    if (asset) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(asset.imageUrl);
      
      set((state) => ({
        customAssets: state.customAssets.filter(a => a.id !== id),
        assets: state.assets.filter(a => a.id !== id),
      }));
      
      toast.success('Asset removed');
    }
  },
  
  getAssetsByCategory: (category: AssetCategory) => {
    const { assets } = get();
    return assets.filter(asset => asset.category === category);
  },
}));