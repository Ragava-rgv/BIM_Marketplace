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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                displayOrder: number;
                slug: string;
                iconKey: string | null;
                imageUrl: string | null;
                listingCount: number;
                categoryId: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            groupId: string | null;
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
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            categoryId: string;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
    }[]>;
    getBySlug(slug: string): Promise<{
        specFields: {
            id: string;
            isFilterable: boolean;
            unit: string | null;
            filterType: import("@prisma/client").$Enums.SpecFilterType;
            options: string[];
            displayOrder: number;
            categoryId: string;
            fieldKey: string;
            fieldLabel: string;
            fieldType: import("@prisma/client").$Enums.SpecFieldType;
            isRequired: boolean;
            helpText: string | null;
        }[];
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
            categoryId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    getSpecTemplate(id: string): Promise<{
        specFields: {
            id: string;
            isFilterable: boolean;
            unit: string | null;
            filterType: import("@prisma/client").$Enums.SpecFilterType;
            options: string[];
            displayOrder: number;
            categoryId: string;
            fieldKey: string;
            fieldLabel: string;
            fieldType: import("@prisma/client").$Enums.SpecFieldType;
            isRequired: boolean;
            helpText: string | null;
        }[];
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
            categoryId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    listPublicSubcategories(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
        categoryId: string;
    }[]>;
}
export declare class AdminCatalogController {
    private readonly catalog;
    constructor(catalog: CatalogService);
    adminListGroups(): Promise<({
        categories: ({
            subcategories: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                displayOrder: number;
                slug: string;
                iconKey: string | null;
                imageUrl: string | null;
                listingCount: number;
                categoryId: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            groupId: string | null;
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
            isFilterable: boolean;
            unit: string | null;
            filterType: import("@prisma/client").$Enums.SpecFilterType;
            options: string[];
            displayOrder: number;
            categoryId: string;
            fieldKey: string;
            fieldLabel: string;
            fieldType: import("@prisma/client").$Enums.SpecFieldType;
            isRequired: boolean;
            helpText: string | null;
        }[];
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
            categoryId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    })[]>;
    createCategory(dto: CreateCategoryDto): Promise<{
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
            categoryId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    updateCategory(id: string, dto: Partial<CreateCategoryDto>): Promise<{
        subcategories: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
            categoryId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    deactivateCategory(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
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
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            listingCount: number;
            categoryId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        groupId: string | null;
        iconKey: string | null;
        imageUrl: string | null;
        thumbnailUrl: string | null;
        listingCount: number;
    }>;
    adminListSubcategories(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
        categoryId: string;
    }[]>;
    createSubcategory(dto: CreateSubcategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
        categoryId: string;
    }>;
    updateSubcategory(id: string, dto: Partial<Omit<CreateSubcategoryDto, 'categoryId'>>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
        categoryId: string;
    }>;
    deactivateSubcategory(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
        categoryId: string;
    }>;
    deleteSubcategory(id: string): Promise<{
        deleted: boolean;
    }>;
    reorderSubcategories(categoryId: string, dto: ReorderDto): Promise<void>;
    uploadSubcategoryImage(id: string, file: Express.Multer.File): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        displayOrder: number;
        slug: string;
        iconKey: string | null;
        imageUrl: string | null;
        listingCount: number;
        categoryId: string;
    }>;
    addSpecField(categoryId: string, dto: AddSpecFieldDto): Promise<{
        id: string;
        isFilterable: boolean;
        unit: string | null;
        filterType: import("@prisma/client").$Enums.SpecFilterType;
        options: string[];
        displayOrder: number;
        categoryId: string;
        fieldKey: string;
        fieldLabel: string;
        fieldType: import("@prisma/client").$Enums.SpecFieldType;
        isRequired: boolean;
        helpText: string | null;
    }>;
    updateSpecField(id: string, dto: Partial<AddSpecFieldDto>): Promise<{
        id: string;
        isFilterable: boolean;
        unit: string | null;
        filterType: import("@prisma/client").$Enums.SpecFilterType;
        options: string[];
        displayOrder: number;
        categoryId: string;
        fieldKey: string;
        fieldLabel: string;
        fieldType: import("@prisma/client").$Enums.SpecFieldType;
        isRequired: boolean;
        helpText: string | null;
    }>;
    deleteSpecField(id: string): Promise<void>;
    reorderSpecFields(categoryId: string, dto: ReorderDto): Promise<void>;
}
