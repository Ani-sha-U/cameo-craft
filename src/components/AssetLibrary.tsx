import { useState, useRef } from "react";
import { useAssetsStore, AssetCategory } from "@/store/assetsStore";
import { useElementsStore } from "@/store/elementsStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  User, 
  Box, 
  Sparkles, 
  Palette, 
  Sticker,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<AssetCategory, any> = {
  characters: User,
  props: Box,
  effects: Sparkles,
  textures: Palette,
  stickers: Sticker,
  custom: Upload,
};

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  characters: 'Characters',
  props: 'Props',
  effects: 'Effects',
  textures: 'Textures',
  stickers: 'Stickers',
  custom: 'Custom',
};

interface AssetLibraryProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AssetLibrary = ({ isCollapsed, onToggleCollapse }: AssetLibraryProps) => {
  const {
    assets,
    selectedCategory,
    customAssets,
    setSelectedCategory,
    addCustomAsset,
    removeCustomAsset,
    getAssetsByCategory,
  } = useAssetsStore();

  const { addElement } = useElementsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);

  const categoryAssets = getAssetsByCategory(selectedCategory);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await addCustomAsset(files[i]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAssetDragStart = (e: React.DragEvent, assetId: string) => {
    setDraggedAssetId(assetId);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('assetId', assetId);
  };

  const handleAssetClick = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    // Get current element count for positioning
    const currentElements = useElementsStore.getState().elements;
    
    // Add to elements store
    const newElement = {
      id: `element-${Date.now()}`,
      label: asset.name,
      image: asset.imageUrl,
      x: 100 + currentElements.length * 20,
      y: 100 + currentElements.length * 20,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 100,
      blur: 0,
      brightness: 100,
      glow: 0,
      blendMode: 'normal' as const,
      maskImage: undefined,
    };

    addElement(newElement);
    toast.success(`Added ${asset.name} to canvas`);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-card border-r border-border transition-all duration-300 flex flex-col relative`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-2 text-muted-foreground hover:text-foreground z-10"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </Button>

      {!isCollapsed && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Asset Library</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Step 7: Drag assets to canvas or timeline
            </p>

            {/* Category Tabs */}
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(CATEGORY_LABELS) as AssetCategory[]).map((category) => {
                const Icon = CATEGORY_ICONS[category];
                const isActive = selectedCategory === category;

                return (
                  <Button
                    key={category}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px]">{CATEGORY_LABELS[category]}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Asset Grid */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Upload Section for Custom Category */}
              {selectedCategory === 'custom' && (
                <div className="mb-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="asset-upload"
                  />
                  <label htmlFor="asset-upload">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      asChild
                    >
                      <div>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Asset
                      </div>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    PNG, SVG, JPG, WebP (max 10MB)
                  </p>
                </div>
              )}

              {/* Assets Grid */}
              {categoryAssets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {selectedCategory === 'custom' 
                    ? 'Upload your first asset to get started'
                    : 'No assets in this category'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {categoryAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="relative group cursor-move"
                      draggable
                      onDragStart={(e) => handleAssetDragStart(e, asset.id)}
                      onClick={() => handleAssetClick(asset.id)}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors bg-muted">
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="mt-1 text-xs font-medium text-center truncate">
                        {asset.name}
                      </div>

                      {/* Delete button for custom assets */}
                      {asset.isCustom && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomAsset(asset.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Help Text */}
          <div className="p-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              💡 Drag assets to canvas or click to add
            </p>
          </div>
        </div>
      )}
    </div>
  );
};