import { AppSettingsService } from './app-settings.service';
declare class UpdateSettingDto {
    value: string;
}
export declare class AdminSettingsController {
    private readonly service;
    constructor(service: AppSettingsService);
    getAll(): Promise<{
        updatedAt: Date;
        key: string;
        value: string;
        label: string;
    }[]>;
    update(key: string, dto: UpdateSettingDto): Promise<{
        updatedAt: Date;
        key: string;
        value: string;
        label: string;
    }>;
}
export {};
