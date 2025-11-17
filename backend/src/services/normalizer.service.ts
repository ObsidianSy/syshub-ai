import { NormalizedDocument, TableSchema } from '../connectors/types.js';

/**
 * Entity types detected from table/column patterns
 */
export enum EntityType {
  USER = 'user',
  PRODUCT = 'product',
  ORDER = 'order',
  CUSTOMER = 'customer',
  TRANSACTION = 'transaction',
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  TICKET = 'ticket',
  ARTICLE = 'article',
  MESSAGE = 'message',
  LOG = 'log',
  UNKNOWN = 'unknown',
}

/**
 * System-specific field mappings
 */
export interface FieldMapping {
  systemId: string;
  tableName: string;
  entityType: EntityType;
  mappings: {
    titleFields?: string[]; // Fields to use for title
    descriptionFields?: string[]; // Fields to use for description
    searchableFields?: string[]; // Fields to include in searchableText
    timestampField?: string; // Primary timestamp field
    authorField?: string; // User/author field
    statusField?: string; // Status field
    tagsField?: string; // Tags/categories field
  };
}

/**
 * Normalization config loaded from database
 */
export interface NormalizationConfig {
  entityMappings: FieldMapping[];
  textFieldPatterns: string[]; // Regex patterns for text fields
  excludeFieldPatterns: string[]; // Fields to exclude from search
  maxSearchableLength: number; // Max length of searchableText
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: NormalizationConfig = {
  entityMappings: [],
  textFieldPatterns: [
    'name',
    'title',
    'description',
    'content',
    'body',
    'text',
    'message',
    'comment',
    'notes',
    'summary',
    'address',
    'email',
  ],
  excludeFieldPatterns: ['password', 'secret', 'token', 'hash', 'salt', 'key'],
  maxSearchableLength: 10000,
};

/**
 * Normalizer Service
 * Transforms raw database rows into normalized documents
 */
export class NormalizerService {
  private config: NormalizationConfig = DEFAULT_CONFIG;
  private mappingsCache: Map<string, FieldMapping> = new Map();

  /**
   * Load configuration from database
   */
  async loadConfig(config?: Partial<NormalizationConfig>): Promise<void> {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // Build cache for faster lookup
    this.mappingsCache.clear();
    for (const mapping of this.config.entityMappings) {
      const key = `${mapping.systemId}:${mapping.tableName}`;
      this.mappingsCache.set(key, mapping);
    }

    console.log(`✅ Normalizer config loaded: ${this.config.entityMappings.length} mappings`);
  }

  /**
   * Detect entity type from table name
   */
  detectEntityType(tableName: string): EntityType {
    const lower = tableName.toLowerCase();

    if (lower.includes('user') || lower.includes('account') || lower.includes('profile')) {
      return EntityType.USER;
    }
    if (lower.includes('product') || lower.includes('item') || lower.includes('sku')) {
      return EntityType.PRODUCT;
    }
    if (lower.includes('order') || lower.includes('sale')) {
      return EntityType.ORDER;
    }
    if (lower.includes('customer') || lower.includes('client')) {
      return EntityType.CUSTOMER;
    }
    if (lower.includes('transaction') || lower.includes('payment')) {
      return EntityType.TRANSACTION;
    }
    if (lower.includes('invoice') || lower.includes('bill')) {
      return EntityType.INVOICE;
    }
    if (lower.includes('ticket') || lower.includes('issue')) {
      return EntityType.TICKET;
    }
    if (lower.includes('article') || lower.includes('post') || lower.includes('blog')) {
      return EntityType.ARTICLE;
    }
    if (lower.includes('message') || lower.includes('chat') || lower.includes('email')) {
      return EntityType.MESSAGE;
    }
    if (lower.includes('log') || lower.includes('audit') || lower.includes('event')) {
      return EntityType.LOG;
    }

    return EntityType.UNKNOWN;
  }

  /**
   * Get field mapping for a system/table
   */
  getMapping(systemId: string, tableName: string): FieldMapping | undefined {
    const key = `${systemId}:${tableName}`;
    return this.mappingsCache.get(key);
  }

  /**
   * Check if field should be included in searchable text
   */
  isSearchableField(fieldName: string, value: any): boolean {
    const lower = fieldName.toLowerCase();

    // Exclude sensitive fields
    for (const pattern of this.config.excludeFieldPatterns) {
      if (lower.includes(pattern)) {
        return false;
      }
    }

    // Must be text-like field
    if (typeof value !== 'string' && typeof value !== 'number') {
      return false;
    }

    // Check if matches text field patterns
    for (const pattern of this.config.textFieldPatterns) {
      if (lower.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract title from row
   */
  extractTitle(row: any, mapping?: FieldMapping, schema?: TableSchema): string {
    // Use custom mapping if available
    if (mapping?.mappings.titleFields) {
      for (const field of mapping.mappings.titleFields) {
        if (row[field]) {
          return String(row[field]).slice(0, 200);
        }
      }
    }

    // Try common title fields
    const titleFields = ['title', 'name', 'subject', 'heading', 'label'];
    for (const field of titleFields) {
      if (row[field]) {
        return String(row[field]).slice(0, 200);
      }
    }

    // Use primary key if available
    if (schema?.primaryKeys && schema.primaryKeys.length > 0 && row[schema.primaryKeys[0]]) {
      return `${schema.tableName} #${row[schema.primaryKeys[0]]}`;
    }

    // Fallback to first string field
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && value.length > 0) {
        return value.slice(0, 200);
      }
    }

    return 'Untitled';
  }

  /**
   * Extract description from row
   */
  extractDescription(row: any, mapping?: FieldMapping): string | undefined {
    // Use custom mapping if available
    if (mapping?.mappings.descriptionFields) {
      for (const field of mapping.mappings.descriptionFields) {
        if (row[field]) {
          return String(row[field]).slice(0, 1000);
        }
      }
    }

    // Try common description fields
    const descFields = ['description', 'content', 'body', 'text', 'summary', 'details'];
    for (const field of descFields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].slice(0, 1000);
      }
    }

    return undefined;
  }

  /**
   * Build searchable text from row
   */
  buildSearchableText(row: any, mapping?: FieldMapping, schema?: TableSchema): string {
    const textParts: string[] = [];

    // Use custom searchable fields if specified
    const searchableFields = mapping?.mappings.searchableFields;

    for (const [key, value] of Object.entries(row)) {
      // Skip if not in custom searchable fields (when specified)
      if (searchableFields && !searchableFields.includes(key)) {
        continue;
      }

      // Skip nulls
      if (value === null || value === undefined) {
        continue;
      }

      // Check if field should be searchable
      if (!searchableFields && !this.isSearchableField(key, value)) {
        continue;
      }

      // Add to searchable text
      if (typeof value === 'string') {
        textParts.push(value);
      } else if (typeof value === 'number') {
        textParts.push(String(value));
      } else if (typeof value === 'boolean') {
        textParts.push(value ? 'yes' : 'no');
      } else if (value instanceof Date) {
        textParts.push(value.toISOString());
      } else if (typeof value === 'object') {
        try {
          textParts.push(JSON.stringify(value));
        } catch {
          // Skip if can't stringify
        }
      }
    }

    let searchableText = textParts.join(' ');

    // Truncate if too long
    if (searchableText.length > this.config.maxSearchableLength) {
      searchableText = searchableText.slice(0, this.config.maxSearchableLength);
    }

    return searchableText;
  }

  /**
   * Generate tags for document
   */
  generateTags(
    systemId: string,
    tableName: string,
    entityType: EntityType,
    row: any,
    mapping?: FieldMapping
  ): string[] {
    const tags: string[] = [];

    // Add system tag
    tags.push(`system:${systemId}`);

    // Add table tag
    tags.push(`table:${tableName}`);

    // Add entity type tag
    if (entityType !== EntityType.UNKNOWN) {
      tags.push(`type:${entityType}`);
    }

    // Add status tag if available
    if (mapping?.mappings.statusField && row[mapping.mappings.statusField]) {
      tags.push(`status:${row[mapping.mappings.statusField]}`);
    }

    // Add custom tags from field
    if (mapping?.mappings.tagsField && row[mapping.mappings.tagsField]) {
      const customTags = row[mapping.mappings.tagsField];
      if (Array.isArray(customTags)) {
        tags.push(...customTags.map((t: any) => String(t)));
      } else if (typeof customTags === 'string') {
        // Split by comma, semicolon, or pipe
        const parsed = customTags.split(/[,;|]/).map((t) => t.trim());
        tags.push(...parsed);
      }
    }

    return tags;
  }

  /**
   * Normalize a single row to NormalizedDocument
   */
  normalize(
    systemId: string,
    tableName: string,
    row: any,
    schema?: TableSchema
  ): NormalizedDocument {
    const mapping = this.getMapping(systemId, tableName);
    const entityType = mapping?.entityType || this.detectEntityType(tableName);

    // Extract core fields
    const title = this.extractTitle(row, mapping, schema);
    const description = this.extractDescription(row, mapping);
    const searchableText = this.buildSearchableText(row, mapping, schema);
    const tags = this.generateTags(systemId, tableName, entityType, row, mapping);

    // Extract timestamp
    let timestamp: Date | undefined;
    if (mapping?.mappings.timestampField && row[mapping.mappings.timestampField]) {
      timestamp = new Date(row[mapping.mappings.timestampField]);
    } else {
      // Try common timestamp fields
      const timestampFields = ['created_at', 'updated_at', 'timestamp', 'date', 'created', 'modified'];
      for (const field of timestampFields) {
        if (row[field]) {
          timestamp = new Date(row[field]);
          break;
        }
      }
    }

    // Extract author
    let author: string | undefined;
    if (mapping?.mappings.authorField && row[mapping.mappings.authorField]) {
      author = String(row[mapping.mappings.authorField]);
    }

    // Build document ID
    const primaryKey = schema?.primaryKeys && schema.primaryKeys.length > 0 
      ? schema.primaryKeys[0] 
      : 'id';
    const documentId = `${systemId}:${tableName}:${row[primaryKey] || 'unknown'}`;

    return {
      id: documentId,
      systemId,
      tableName,
      entityType,
      title,
      description,
      searchableText,
      metadata: {
        ...row,
        _normalized_at: new Date(),
        _entity_type: entityType,
      },
      tags,
      timestamp,
      author,
    };
  }

  /**
   * Normalize multiple rows
   */
  normalizeMany(
    systemId: string,
    tableName: string,
    rows: any[],
    schema?: TableSchema
  ): NormalizedDocument[] {
    return rows.map((row) => this.normalize(systemId, tableName, row, schema));
  }

  /**
   * Add custom mapping
   */
  addMapping(mapping: FieldMapping): void {
    const key = `${mapping.systemId}:${mapping.tableName}`;
    this.mappingsCache.set(key, mapping);
    
    // Add to config if not already present
    const exists = this.config.entityMappings.find(
      (m) => m.systemId === mapping.systemId && m.tableName === mapping.tableName
    );
    
    if (!exists) {
      this.config.entityMappings.push(mapping);
    }
  }

  /**
   * Remove mapping
   */
  removeMapping(systemId: string, tableName: string): void {
    const key = `${systemId}:${tableName}`;
    this.mappingsCache.delete(key);
    
    this.config.entityMappings = this.config.entityMappings.filter(
      (m) => !(m.systemId === systemId && m.tableName === tableName)
    );
  }

  /**
   * Get all mappings for a system
   */
  getSystemMappings(systemId: string): FieldMapping[] {
    return this.config.entityMappings.filter((m) => m.systemId === systemId);
  }
}

// Export singleton instance
export const normalizerService = new NormalizerService();
