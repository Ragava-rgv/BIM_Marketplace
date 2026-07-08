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
    getCategoryWithSpecTemplate(categoryId: string): Promise<{
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
    getCategoryBySlug(slug: string): Promise<{
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
    softDeleteCategory(id: string): Promise<{
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
    hardDeleteCategory(id: string): Promise<{
        deleted: boolean;
    }>;
    deleteCategory(id: string): Promise<{
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
    reorderCategories(ids: string[]): Promise<void>;
    uploadCategoryImage(categoryId: string, file: Express.Multer.File): Promise<{
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
    listSubcategories(categoryId: string): Promise<{
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
    softDeleteSubcategory(id: string): Promise<{
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
    hardDeleteSubcategory(id: string): Promise<{
        deleted: boolean;
    }>;
    reorderSubcategories(categoryId: string, ids: string[]): Promise<void>;
    uploadSubcategoryImage(subcategoryId: string, file: Express.Multer.File): Promise<{
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
    updateSpecField(fieldId: string, dto: Partial<AddSpecFieldDto>): Promise<{
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
    deleteSpecField(fieldId: string): Promise<void>;
    reorderSpecFields(categoryId: string, ids: string[]): Promise<void>;
    private requireGroup;
    private requireCategory;
    private requireSubcategory;
}
