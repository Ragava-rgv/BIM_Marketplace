import { CatalogService } from './catalog.service';
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { AddSpecFieldDto } from './dto/add-spec-field.dto';
import { ReorderDto } from './dto/reorder.dto';
export declare class CategoryGroupsController {
    private readonly catalog;
    constructor(catalog: CatalogService);
    listGroups(): Promise<({
        categories: ({
            subcategories: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                categoryId: string;
                displayOrder: number;
                slug: string;
                iconKey: string | null;
                imageUrl: string | null;
                listingCount: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            groupId: string | null;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            thumbnailUrl: string | null;
            listingCount: number;
        })[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
    })[]>;
}
export declare class CategoriesController {
    private readonly catalog;
    constructor(catalog: CatalogService);
    listCategories(): Promise<{
        listingCount: number;
        subcategories: {
            listingCount: number;
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            categoryId: string;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
        }[];
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
    }[]>;
    getBySlug(slug: string): Promise<{
        specFields: {
            id: string;
            options: string[];
            categoryId: string;
            subcategoryId: string | null;
            fieldKey: string;
            fieldLabel: string;
            unit: string | null;
            fieldType: import("@prisma/client").$Enums.SpecFieldType;
            isRequired: boolean;
            isFilterable: boolean;
            filterType: import("@prisma/client").$Enums.SpecFilterType;
            displayOrder: number;
            helpText: string | null;
        }[];
        subcategories: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            categoryId: string;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    getSpecTemplate(id: string, subcategoryId?: string): Promise<{
        specFields: {
            id: string;
            options: string[];
            categoryId: string;
            subcategoryId: string | null;
            fieldKey: string;
            fieldLabel: string;
            unit: string | null;
            fieldType: import("@prisma/client").$Enums.SpecFieldType;
            isRequired: boolean;
            isFilterable: boolean;
            filterType: import("@prisma/client").$Enums.SpecFilterType;
            displayOrder: number;
            helpText: string | null;
        }[];
        subcategories: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            categoryId: string;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    listPublicSubcategories(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        categoryId: string;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
    }[]>;
}
export declare class AdminCatalogController {
    private readonly catalog;
    constructor(catalog: CatalogService);
    adminListGroups(): Promise<({
        categories: ({
            subcategories: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                categoryId: string;
                displayOrder: number;
                slug: string;
                iconKey: string | null;
                imageUrl: string | null;
                listingCount: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            groupId: string | null;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            thumbnailUrl: string | null;
            listingCount: number;
        })[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
    })[]>;
    createGroup(dto: CreateCategoryGroupDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
    }>;
    updateGroup(id: string, dto: Partial<CreateCategoryGroupDto>): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
    }>;
    deleteGroup(id: string): Promise<void>;
    reorderGroups(dto: ReorderDto): Promise<void>;
    adminListCategories(): Promise<({
        _count: {
            listings: number;
        };
        group: {
            id: string;
            name: string;
            isActive: boolean;
            displayOrder: number;
        } | null;
        specFields: {
            id: string;
            options: string[];
            categoryId: string;
            subcategoryId: string | null;
            fieldKey: string;
            fieldLabel: string;
            unit: string | null;
            fieldType: import("@prisma/client").$Enums.SpecFieldType;
            isRequired: boolean;
            isFilterable: boolean;
            filterType: import("@prisma/client").$Enums.SpecFilterType;
            displayOrder: number;
            helpText: string | null;
        }[];
        subcategories: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            categoryId: string;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    })[]>;
    createCategory(dto: CreateCategoryDto): Promise<{
        subcategories: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            categoryId: string;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    updateCategory(id: string, dto: Partial<CreateCategoryDto>): Promise<{
        subcategories: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            categoryId: string;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    deactivateCategory(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    deleteCategory(id: string): Promise<{
        deleted: boolean;
    }>;
    reorderCategories(dto: ReorderDto): Promise<void>;
    uploadCategoryImage(id: string, file: Express.Multer.File): Promise<{
        subcategories: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            categoryId: string;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        groupId: string | null;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    adminListSubcategories(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        categoryId: string;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
    }[]>;
    createSubcategory(dto: CreateSubcategoryDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        categoryId: string;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
    }>;
    updateSubcategory(id: string, dto: Partial<Omit<CreateSubcategoryDto, 'categoryId'>>): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        categoryId: string;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
    }>;
    deactivateSubcategory(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        categoryId: string;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
    }>;
    deleteSubcategory(id: string): Promise<{
        deleted: boolean;
    }>;
    reorderSubcategories(categoryId: string, dto: ReorderDto): Promise<void>;
    uploadSubcategoryImage(id: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        categoryId: string;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
    }>;
    addSpecField(categoryId: string, dto: AddSpecFieldDto): Promise<{
        id: string;
        options: string[];
        categoryId: string;
        subcategoryId: string | null;
        fieldKey: string;
        fieldLabel: string;
        unit: string | null;
        fieldType: import("@prisma/client").$Enums.SpecFieldType;
        isRequired: boolean;
        isFilterable: boolean;
        filterType: import("@prisma/client").$Enums.SpecFilterType;
        displayOrder: number;
        helpText: string | null;
    }>;
    updateSpecField(id: string, dto: Partial<AddSpecFieldDto>): Promise<{
        id: string;
        options: string[];
        categoryId: string;
        subcategoryId: string | null;
        fieldKey: string;
        fieldLabel: string;
        unit: string | null;
        fieldType: import("@prisma/client").$Enums.SpecFieldType;
        isRequired: boolean;
        isFilterable: boolean;
        filterType: import("@prisma/client").$Enums.SpecFilterType;
        displayOrder: number;
        helpText: string | null;
    }>;
    deleteSpecField(id: string): Promise<void>;
    reorderSpecFields(categoryId: string, dto: ReorderDto): Promise<void>;
}
