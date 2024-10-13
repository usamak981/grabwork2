import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Home2 from './pages/Home2';
import Profile from './pages/Profile';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderList from './pages/ProviderList';
import ProviderOrder from './pages/ProviderOrder';
import MyOrder from './pages/MyOrder';
import Header from './components/Header';
import BottomTab from './components/BottomTab';
import RequestCleaner from './components/RequestCleaner';
import CleanerConfirmation from './components/CleanerConfirmation';
import AvailableProviders from './pages/AvailableProviders';
import ProviderOrderDetail from './pages/ProviderOrderDetail';
import MyOrderDetail from './pages/MyOrderDetail';
import MyHistory from './pages/MyHistory';
import Messages from './pages/Messages';
import ChatList from './components/ChatList';
import ErrorBoundary from './components/ErrorBoundary';
import RequestTemplate from './pages/RequestTemplate';
import Confirmation from './pages/Confirmation';
import UserReview from './pages/UserReview';
import UserPointHistory from './pages/UserPointHistory';

// Admin pages
import ProviderManagement from './pages/admin/ProviderManagement';
import UserList from './pages/admin/UserList';
import SingleUser from './pages/admin/SingleUser';
import ProviderDetail from './pages/admin/ProviderDetail';
import ReviewManagement from './pages/admin/ReviewManagement';
import AdminPointHistory from './pages/admin/AdminPointHistory';

const Layout = ({ children }) => (
  <>
    <Header />
    <main className="container pb-5">
      {children}
    </main>
    <BottomTab />
  </>
);

function App() {
  console.log('App component rendered');

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home2 />} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/provider-dashboard" element={<Layout><ProtectedRoute><ProviderDashboard /></ProtectedRoute></Layout>} />
              <Route path="/provider-list" element={<Layout><ProviderList /></Layout>} />
              <Route path="/provider-orders" element={<Layout><ProtectedRoute><ProviderOrder /></ProtectedRoute></Layout>} />
              <Route path="/provider-order-detail/:orderId" element={<Layout><ProtectedRoute><ProviderOrderDetail /></ProtectedRoute></Layout>} />
              <Route path="/request-cleaner" element={<Layout><RequestCleaner /></Layout>} />
              <Route path="/cleaner-confirmation" element={<Layout><CleanerConfirmation /></Layout>} />
              <Route path="/request-template" element={<Layout><RequestTemplate /></Layout>} />
              <Route path="/my-order" element={<Layout><ProtectedRoute><MyOrder /></ProtectedRoute></Layout>} />
              <Route path="/my-history" element={<Layout><ProtectedRoute><MyHistory /></ProtectedRoute></Layout>} />
              <Route path="/my-order-detail/:orderId" element={<Layout><ProtectedRoute><MyOrderDetail /></ProtectedRoute></Layout>} />
              <Route path="/order-history/:orderId" element={<Layout><ProtectedRoute><MyOrderDetail /></ProtectedRoute></Layout>} />
              <Route path="/available-providers" element={<Layout><AvailableProviders /></Layout>} />
              <Route path="/message-list" element={<Layout><ProtectedRoute><Messages /></ProtectedRoute></Layout>} />
              <Route path="/message-list/:chatId" element={<Layout><ProtectedRoute><Messages /></ProtectedRoute></Layout>} />
              <Route path="/confirmation" element={<Layout><Confirmation /></Layout>} />
              <Route path="/user-review/:orderId" element={<Layout><ProtectedRoute><UserReview /></ProtectedRoute></Layout>} />
              <Route path="/admin/reviews" element={<Layout><ProtectedRoute adminOnly><ReviewManagement /></ProtectedRoute></Layout>} />
              <Route path="/admin/user-points/:userId" element={<Layout><ProtectedRoute adminOnly><UserPointHistory /></ProtectedRoute></Layout>} />
              <Route path="/my-points" element={<Layout><ProtectedRoute><UserPointHistory /></ProtectedRoute></Layout>} />
              <Route path="/admin/point-history" element={<Layout><ProtectedRoute adminOnly><AdminPointHistory /></ProtectedRoute></Layout>} />
              {/* Admin routes */}
              <Route 
                path="/admin/provider-management" 
                element={
                  <Layout>
                    <ProtectedRoute adminOnly={true}>
                      <ProviderManagement />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin/user-list" 
                element={
                  <Layout>
                    <ProtectedRoute adminOnly={true}>
                      <UserList />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin/user/:userId" 
                element={
                  <Layout>
                    <ProtectedRoute adminOnly={true}>
                      <SingleUser />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route 
                path="/admin/provider/:providerId" 
                element={
                  <Layout>
                    <ProtectedRoute adminOnly={true}>
                      <ProviderDetail />
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export const routeNames = [
  '/', '/profile', '/provider-dashboard', '/provider-list', '/provider-orders', '/provider-order-detail',
  '/request-cleaner', '/cleaner-confirmation', '/my-order', '/my-history',
  '/my-order-detail', '/order-history', '/available-providers', '/message-list',
  '/admin/provider-management', '/admin/user-list', '/admin/user', '/admin/provider',
  '/admin/reviews', '/admin/user-points', '/my-points', '/admin/point-history'
];

export default App;