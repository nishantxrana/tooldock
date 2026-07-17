import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireConnection } from '@/components/common/RequireConnection';
import { ConnectionPage } from '@/features/connection/ConnectionPage';
import { TOOLS, DEFAULT_TOOL_PATH } from '@/features/tools/registry';

/** Routes are generated from the tool registry. */
export const router = createBrowserRouter([
  {
    path: '/connect',
    element: <ConnectionPage />,
  },
  {
    path: '/',
    element: (
      <RequireConnection>
        <AppShell />
      </RequireConnection>
    ),
    children: [
      { index: true, element: <Navigate to={DEFAULT_TOOL_PATH} replace /> },
      ...TOOLS.map((tool) => ({
        path: tool.path.replace(/^\//, ''),
        element: createElement(tool.component),
      })),
      { path: '*', element: <Navigate to={DEFAULT_TOOL_PATH} replace /> },
    ],
  },
]);
