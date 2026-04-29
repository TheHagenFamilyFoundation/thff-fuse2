import '@angular/compiler';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from 'environments/environment';
import { AppModule } from 'app/app.module';

/** After a deploy, stale bundles may reference deleted lazy chunks; reload once to pick up the new index. */
function registerChunkLoadRecovery(): void
{
    const flag = '__thff_chunk_reload';
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) =>
    {
        const reason = event.reason as { name?: string; message?: string } | undefined;
        const name = reason?.name ?? '';
        const message = reason?.message ?? String(reason ?? '');
        const isChunk =
            name === 'ChunkLoadError' ||
            /Loading chunk [\d]+ failed/i.test(message) ||
            message.includes('ChunkLoadError');
        if (!isChunk || sessionStorage.getItem(flag))
        {
            return;
        }
        sessionStorage.setItem(flag, '1');
        event.preventDefault();
        window.location.reload();
    });
}

registerChunkLoadRecovery();

if ( environment.production )
{
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
                        .catch(err => console.error(err));
