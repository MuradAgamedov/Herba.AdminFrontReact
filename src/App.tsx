import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import DashboardLayout from './layouts/DashboardLayout'
import AboutForm from './pages/about/AboutForm'
import AimForm from './pages/aims/AimForm'
import AimList from './pages/aims/AimList'
import AnalysisForm from './pages/analyses/AnalysisForm'
import AnalysisList from './pages/analyses/AnalysisList'
import BlogCategoryForm from './pages/blogCategories/BlogCategoryForm'
import BlogCategoryList from './pages/blogCategories/BlogCategoryList'
import BlogForm from './pages/blogs/BlogForm'
import BlogList from './pages/blogs/BlogList'
import Dashboard from './pages/Dashboard'
import FeaturedProductList from './pages/featuredProducts/FeaturedProductList'
import FooterCategoryList from './pages/footerCategories/FooterCategoryList'
import HeroForm from './pages/hero/HeroForm'
import Login from './pages/Login'
import ProductCategoryForm from './pages/productCategories/ProductCategoryForm'
import ProductCategoryList from './pages/productCategories/ProductCategoryList'
import ProductForm from './pages/products/ProductForm'
import ProductList from './pages/products/ProductList'
import TestimonialForm from './pages/testimonials/TestimonialForm'
import TestimonialList from './pages/testimonials/TestimonialList'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="hero" element={<HeroForm />} />
        <Route path="about" element={<AboutForm />} />
        <Route path="blogs" element={<BlogList />} />
        <Route path="blogs/new" element={<BlogForm />} />
        <Route path="blogs/:id/edit" element={<BlogForm />} />
        <Route path="blogs/categories" element={<BlogCategoryList />} />
        <Route path="blogs/categories/new" element={<BlogCategoryForm />} />
        <Route path="blogs/categories/:id/edit" element={<BlogCategoryForm />} />
        <Route path="blogs/footer-categories" element={<FooterCategoryList />} />
        <Route path="testimonials" element={<TestimonialList />} />
        <Route path="testimonials/new" element={<TestimonialForm />} />
        <Route path="testimonials/:id/edit" element={<TestimonialForm />} />
        <Route path="aims" element={<AimList />} />
        <Route path="aims/new" element={<AimForm />} />
        <Route path="aims/:id/edit" element={<AimForm />} />
        <Route path="analyses" element={<AnalysisList />} />
        <Route path="analyses/new" element={<AnalysisForm />} />
        <Route path="analyses/:id/edit" element={<AnalysisForm />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="products/categories" element={<ProductCategoryList />} />
        <Route path="products/categories/new" element={<ProductCategoryForm />} />
        <Route path="products/categories/:id/edit" element={<ProductCategoryForm />} />
        <Route path="products/featured" element={<FeaturedProductList />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
