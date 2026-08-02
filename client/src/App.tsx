import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from './store/ToastContext';
import { router } from './routes/AppRoutes';

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
