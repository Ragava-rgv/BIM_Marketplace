import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import type { AddSpecFieldDto } from './dto/add-spec-field.dto';
export declare class CatalogService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
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
    getCategoryWithSpecTemplate(categoryId: string, subcategoryId?: string): Promise<{
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
    getCategoryBySlug(slug: string): Promise<{
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
    reorderGroups(ids: string[]): Promise<void>;
    listAllCategories(): Promise<({
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
    softDeleteCategory(id: string): Promise<{
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
    hardDeleteCategory(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteCategory(id: string): Promise<{
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
    reorderCategories(ids: string[]): Promise<void>;
    uploadCategoryImage(categoryId: string, file: Express.Multer.File): Promise<{
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
    listSubcategories(categoryId: string): Promise<{
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
    softDeleteSubcategory(id: string): Promise<{
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
    hardDeleteSubcategory(id: string): Promise<{
        deleted: boolean;
    }>;
    reorderSubcategories(categoryId: string, ids: string[]): Promise<void>;
    uploadSubcategoryImage(subcategoryId: string, file: Express.Multer.File): Promise<{
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
    updateSpecField(fieldId: string, dto: Partial<AddSpecFieldDto>): Promise<{
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
    deleteSpecField(fieldId: string): Promise<void>;
    reorderSpecFields(categoryId: string, ids: string[]): Promise<void>;
    private requireGroup;
    private requireCategory;
    private requireSubcategory;
}
