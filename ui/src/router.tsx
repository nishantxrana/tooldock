import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireConnection } from '@/components/common/RequireConnection';
import { HomePage } from '@/features/home/HomePage';
import { ConnectPage } from '@/features/connection/ConnectPage';
import { TOOLS, DEFAULT_TOOL_PATH } from '@/features/tools/registry';

/** Routes are generated from the tool registry. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'connect', element: <ConnectPage /> },
      ...TOOLS.map((tool) => ({
        path: tool.path.replace(/^\//, ''),
        element: tool.requiresConnection ? (
          <RequireConnection>
            {createElement(tool.component)}
          </RequireConnection>
        ) : (
          createElement(tool.component)
        ),
      })),
      { path: '*', element: <Navigate to={DEFAULT_TOOL_PATH} replace /> },
    ],
  },
]);
