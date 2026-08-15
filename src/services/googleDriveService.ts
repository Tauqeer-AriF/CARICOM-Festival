export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  size?: string;
  sizeFormatted?: string;
  createdTime: string;
  webViewLink?: string;
  webContentLink?: string;
  description?: string;
  thumbnailLink?: string;
}

export interface GoogleDriveConfig {
  autoUploadEnabled: boolean;
  folderId?: string;
  folderName?: string;
  folderWebViewLink?: string;
  lastSyncTime?: string;
  userEmail?: string;
  syncedSnapshotNames?: string[];
}

export const googleDriveService = {
  /**
   * Fetch current Google Drive settings and sync state stored on the server
   */
  async getSettings(): Promise<GoogleDriveConfig> {
    try {
      const res = await fetch('/api/admin/backup/drive/settings');
      if (!res.ok) throw new Error('Failed to load Google Drive settings');
      return await res.json();
    } catch (e) {
      console.warn('Error fetching drive settings:', e);
      return {
        autoUploadEnabled: false,
        folderName: 'Grenada CARICOM Festival Backups 2027',
        syncedSnapshotNames: []
      };
    }
  },

  /**
   * Update server-side Google Drive sync settings
   */
  async saveSettings(settings: Partial<GoogleDriveConfig>): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/backup/drive/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to save drive settings:', e);
      return false;
    }
  },

  /**
   * Ensure a dedicated Google Drive folder exists for festival backups
   */
  async ensureFolder(token: string): Promise<{ folderId: string; folderName: string; webViewLink?: string }> {
    const res = await fetch('/api/admin/backup/drive/ensure-folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to access or create Google Drive folder' }));
      throw new Error(data.error || 'Failed to initialize Google Drive folder');
    }

    return await res.json();
  },

  /**
   * List all backup snapshots currently stored in the Google Drive folder
   */
  async listBackups(token: string, folderId?: string): Promise<GoogleDriveBackupFile[]> {
    const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : '';
    const res = await fetch(`/api/admin/backup/drive/list${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to fetch Drive backups' }));
      throw new Error(data.error || 'Failed to list backups from Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Upload a specific local backup snapshot to Google Drive
   */
  async uploadSnapshot(
    token: string,
    snapshotFilename: string,
    folderId?: string
  ): Promise<{ success: boolean; file: GoogleDriveBackupFile; message?: string }> {
    const res = await fetch('/api/admin/backup/drive/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snapshotFilename,
        folderId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload backup to Google Drive');
    }

    return await res.json();
  },

  /**
   * One-click create snapshot and immediately upload it to Google Drive
   */
  async createAndUpload(
    token: string,
    label?: string,
    folderId?: string
  ): Promise<{ success: boolean; filename: string; driveFile: GoogleDriveBackupFile }> {
    const res = await fetch('/api/admin/backup/drive/create-and-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ label, folderId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Backup & Upload failed' }));
      throw new Error(err.error || 'Failed to create and upload backup to Google Drive');
    }

    return await res.json();
  },

  /**
   * Restore the entire system directly from a Google Drive file ID
   */
  async restoreFromDrive(
    token: string,
    driveFileId: string
  ): Promise<{ success: boolean; message: string; summary?: any }> {
    const res = await fetch('/api/admin/backup/drive/restore', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ driveFileId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Restore failed' }));
      throw new Error(err.error || 'Failed to restore backup from Google Drive');
    }

    return await res.json();
  },

  /**
   * Delete a backup file from Google Drive
   */
  async deleteFromDrive(token: string, driveFileId: string): Promise<boolean> {
    const res = await fetch(`/api/admin/backup/drive/file/${encodeURIComponent(driveFileId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete file from Google Drive' }));
      throw new Error(err.error || 'Could not delete backup from Google Drive');
    }

    return true;
  }
};
