import { TonConnectUIProvider } from '@tonconnect/ui-react';

import { App } from '@/components/App.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';
import { AppWrapper } from '@/components/AppWrapper.tsx';
import { publicUrl } from '@/helpers/publicUrl.ts';
import { QuizDataProvider } from '@/contexts/QuizDataContext';
import { UserProvider } from '@/contexts/UserContext';

function ErrorBoundaryError({ error }: { error: unknown }) {
 return (
   <div>
     <p>An unhandled error occurred:</p>
     <blockquote>
       <code>
         {error instanceof Error
           ? error.message
           : typeof error === 'string'
           ? error
           : JSON.stringify(error)}
       </code>
     </blockquote>
   </div>
 );
}

export function Root() {
 return (
   <ErrorBoundary fallback={ErrorBoundaryError}>
     <TonConnectUIProvider manifestUrl={publicUrl('tonconnect-manifest.json')}>
       <UserProvider>
         <QuizDataProvider>
           <AppWrapper>
             <App />
           </AppWrapper>
         </QuizDataProvider>
       </UserProvider>
     </TonConnectUIProvider>
   </ErrorBoundary>
 );
}

