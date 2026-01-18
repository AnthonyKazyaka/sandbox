// Import/Export service implementation
import { Goal, AppSettings } from '../models/types';
import { DataExport, ImportExportService } from './types';
import { goalRepository, GoalRepositoryImpl } from './goalRepository';
import { settingsRepository, SettingsRepositoryImpl } from './settingsRepository';

const APP_VERSION = '1.0.0';

export class ImportExportServiceImpl implements ImportExportService {
  private goalRepo: GoalRepositoryImpl;
  private settingsRepo: SettingsRepositoryImpl;

  constructor(
    goalRepo: GoalRepositoryImpl = goalRepository,
    settingsRepo: SettingsRepositoryImpl = settingsRepository
  ) {
    this.goalRepo = goalRepo;
    this.settingsRepo = settingsRepo;
  }

  async exportAll(): Promise<DataExport> {
    const goals = await this.goalRepo.getAll();
    const settings = await this.settingsRepo.get();

    return {
      version: APP_VERSION,
      exportedAt: Date.now(),
      goals,
      settings,
    };
  }

  async importAll(data: DataExport): Promise<void> {
    // Validate version (for future compatibility)
    if (!data.version) {
      throw new Error('Invalid export data: missing version');
    }

    // Clear existing data
    await this.goalRepo.removeAll();

    // Import goals
    for (const goal of data.goals) {
      await this.goalRepo.upsert(goal);
    }

    // Import settings
    if (data.settings) {
      await this.settingsRepo.save(data.settings);
    }
  }
}

// Singleton instance
export const importExportService = new ImportExportServiceImpl();
