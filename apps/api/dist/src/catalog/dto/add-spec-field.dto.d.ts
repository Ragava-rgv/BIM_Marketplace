export declare enum SpecFieldTypeDto {
    number = "number",
    text = "text",
    select = "select",
    boolean = "boolean"
}
export declare enum SpecFilterTypeDto {
    range = "range",
    exact = "exact",
    none = "none"
}
export declare class AddSpecFieldDto {
    subcategoryId?: string;
    fieldKey: string;
    fieldLabel: string;
    unit?: string;
    fieldType: SpecFieldTypeDto;
    options?: string[];
    isRequired?: boolean;
    isFilterable?: boolean;
    filterType?: SpecFilterTypeDto;
    displayOrder?: number;
    helpText?: string;
}
