export type AnalyticsEvent =
  | 'record_add'
  | 'record_update'
  | 'record_import'
  | 'system_reset'
  | 'backup_download'
  | 'restore_success'
  | 'bookmark_add'
  | 'identity_add';

function send(event: AnalyticsEvent, data: Record<string, any> = {}) {
  try {
    // Plausible style
    if (typeof (window as any).plausible === 'function') {
      (window as any).plausible(event, { props: data });
    } else {
      // Fallback console
      console.info('[analytics]', event, data);
    }
  } catch (e) {
    // swallow
  }
}

export const analytics = {
  recordAdded: (month: number, year: number, amountKg: number) => send('record_add', { month, year, amountKg }),
  recordUpdated: (month: number, year: number) => send('record_update', { month, year }),
  recordImported: (count: number) => send('record_import', { count }),
  systemReset: () => send('system_reset'),
  backupDownloaded: (count: number) => send('backup_download', { count }),
  restoreSuccess: (count: number) => send('restore_success', { count }),
  bookmarkAdded: (year: number) => send('bookmark_add', { year }),
  identityAdded: (name: string) => send('identity_add', { name }),
};
