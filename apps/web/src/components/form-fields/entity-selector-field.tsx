'use client';

import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { Search, MapPin, Package, Wrench, X } from 'lucide-react';

export interface EntitySelectorFieldProps {
  field: {
    id: string;
    label: string;
    required?: boolean;
    helpText?: string;
    options?: {
      source: string;
      value?: {
        entityType?: string | null;
        tags?: string[];
      };
    };
  };
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
}

/**
 * EntitySelectorField - Searchable dropdown to select an entity
 */
export function EntitySelectorField({
  field,
  value,
  onChange,
  error,
}: EntitySelectorFieldProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Extract entity type filter from options
  const entityTypeFilter = field.options?.value?.entityType || undefined;
  const tagsFilter = field.options?.value?.tags || undefined;

  // Fetch entities
  const { data: entitiesData, isLoading } = trpc.entities.getAll.useQuery({
    entityType: entityTypeFilter,
    tags: tagsFilter && tagsFilter.length > 0 ? tagsFilter : undefined,
    limit: 100,
  });

  const entities = entitiesData?.items || [];

  // Find selected entity
  const selectedEntity = value ? entities.find(e => e.id === value) : null;

  // Filter entities by search query
  const filteredEntities = useMemo(() => {
    if (!searchQuery) return entities;

    const query = searchQuery.toLowerCase();
    return entities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(query) ||
        entity.code?.toLowerCase().includes(query) ||
        entity.entityType.toLowerCase().includes(query)
    );
  }, [entities, searchQuery]);

  // Get icon for entity type
  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'site':
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'equipment':
        return <Wrench className="h-4 w-4" />;
      case 'asset':
        return <Package className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const handleSelect = (entityId: string) => {
    onChange(entityId);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>

      {/* Selected Entity Display */}
      {selectedEntity && !showDropdown && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          <div className="text-primary">{getEntityIcon(selectedEntity.entityType)}</div>
          <div className="flex-1">
            <div className="text-sm font-medium">{selectedEntity.name}</div>
            <div className="text-xs text-muted-foreground">
              {selectedEntity.entityType}
              {selectedEntity.code && ` • ${selectedEntity.code}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDropdown(true)}
            className="px-3 py-1 text-sm border border-border rounded hover:bg-accent"
          >
            Change
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-destructive/10 rounded text-destructive"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search/Select UI */}
      {(!selectedEntity || showDropdown) && (
        <div className="relative">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={`Search ${entityTypeFilter || 'entities'}...`}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                error ? 'border-destructive' : 'border-border'
              }`}
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading entities...
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No entities found matching your search' : 'No entities available'}
                </div>
              ) : (
                <div className="py-1">
                  {filteredEntities.map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => handleSelect(entity.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
                    >
                      <div className="text-primary">
                        {getEntityIcon(entity.entityType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {entity.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entity.entityType}
                          {entity.code && ` • ${entity.code}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Close Dropdown Button */}
              {selectedEntity && (
                <div className="border-t p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-sm text-center border border-border rounded hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {field.helpText && !error && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Entity Type Filter Info */}
      {entityTypeFilter && (
        <p className="text-xs text-muted-foreground">
          Showing only: <strong>{entityTypeFilter}</strong> entities
        </p>
      )}
    </div>
  );
}
