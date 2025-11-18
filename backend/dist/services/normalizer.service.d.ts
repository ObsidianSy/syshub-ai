import { NormalizedDocument, TableSchema } from '../connectors/types.js';
/**
 * Entity types detected from table/column patterns
 */
export declare enum EntityType {
    USER = "user",
    PRODUCT = "product",
    ORDER = "order",
    CUSTOMER = "customer",
    TRANSACTION = "transaction",
    INVOICE = "invoice",
    PAYMENT = "payment",
    TICKET = "ticket",
    ARTICLE = "article",
    MESSAGE = "message",
    LOG = "log",
    UNKNOWN = "unknown"
}
/**
 * System-specific field mappings
 */
export interface FieldMapping {
    systemId: string;
    tableName: string;
    entityType: EntityType;
    mappings: {
        titleFields?: string[];
        descriptionFields?: string[];
        searchableFields?: string[];
        timestampField?: string;
        authorField?: string;
        statusField?: string;
        tagsField?: string;
    };
}
/**
 * Normalization config loaded from database
 */
export interface NormalizationConfig {
    entityMappings: FieldMapping[];
    textFieldPatterns: string[];
    excludeFieldPatterns: string[];
    maxSearchableLength: number;
}
/**
 * Normalizer Service
 * Transforms raw database rows into normalized documents
 */
export declare class NormalizerService {
    private config;
    private mappingsCache;
    /**
     * Load configuration from database
     */
    loadConfig(config?: Partial<NormalizationConfig>): Promise<void>;
    /**
     * Detect entity type from table name
     */
    detectEntityType(tableName: string): EntityType;
    /**
     * Get field mapping for a system/table
     */
    getMapping(systemId: string, tableName: string): FieldMapping | undefined;
    /**
     * Check if field should be included in searchable text
     */
    isSearchableField(fieldName: string, value: any): boolean;
    /**
     * Extract title from row
     */
    extractTitle(row: any, mapping?: FieldMapping, schema?: TableSchema): string;
    /**
     * Extract description from row
     */
    extractDescription(row: any, mapping?: FieldMapping): string | undefined;
    /**
     * Build searchable text from row
     */
    buildSearchableText(row: any, mapping?: FieldMapping, schema?: TableSchema): string;
    /**
     * Generate tags for document
     */
    generateTags(systemId: string, tableName: string, entityType: EntityType, row: any, mapping?: FieldMapping): string[];
    /**
     * Normalize a single row to NormalizedDocument
     */
    normalize(systemId: string, tableName: string, row: any, schema?: TableSchema): NormalizedDocument;
    /**
     * Normalize multiple rows
     */
    normalizeMany(systemId: string, tableName: string, rows: any[], schema?: TableSchema): NormalizedDocument[];
    /**
     * Add custom mapping
     */
    addMapping(mapping: FieldMapping): void;
    /**
     * Remove mapping
     */
    removeMapping(systemId: string, tableName: string): void;
    /**
     * Get all mappings for a system
     */
    getSystemMappings(systemId: string): FieldMapping[];
}
export declare const normalizerService: NormalizerService;
//# sourceMappingURL=normalizer.service.d.ts.map