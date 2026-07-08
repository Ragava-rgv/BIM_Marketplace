import type { Response } from 'express';
import { StorageService } from '../storage/storage.service';
export declare class MediaController {
    private readonly storage;
    constructor(storage: StorageService);
    stream(subfolder: string, filename: string, res: Response): Promise<void>;
}
