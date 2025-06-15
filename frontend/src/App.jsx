import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Register from './intro/Register'
import Login from './intro/Login'
import HomePage from './intro/HomePage'
import UserDashboard from './user/UserDashboard'
import AdminDashboard from './admin/AdminDashboard'
import UserManagement from './admin/UserManagement'
import AddBook from './user/AddBook'
import EditBook from './user/EditBook'
import BrowseBooks from './user/BrowseBooks'
import BookDetail from './user/BookDetail'
import AddWishlist from './user/AddWishlist'
import Notifications from './user/Notifications'
import ExchangeDetails from './user/ExchangeDetails'
import ExchangePage from './user/ExchangePage'
import ComplaintsManagement from './admin/ComplaintsManagement'
import ComplaintPage from './user/ComplaintPage'
import AdminBrowseBooks from './admin/AdminBrowseBooks'
import AdminBookDetail from './admin/AdminBookDetail'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Routes>
          <Route path='/' element={<HomePage/>} />
          <Route path='/register' element={<Register/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/user-dashboard' element={<UserDashboard/>} />
          <Route path='/admin' element={<AdminDashboard/>} />
          <Route path='/admin/complaints' element={<ComplaintsManagement />} />
          <Route path='/admin/users' element={<UserManagement/>} />
          <Route path='/admin/books' element={<AdminBrowseBooks/>} />
          <Route path='/admin/books/:id' element={<AdminBookDetail/>} />
          <Route path='/add-book' element={<AddBook/>} />
          <Route path='/edit-book/:id' element={<EditBook/>} />
          <Route path='/books' element={<BrowseBooks/>} />
          <Route path='/books/:id' element={<BookDetail/>} />
          <Route path='/add-wishlist-item' element={<AddWishlist/>} />
          <Route path='/notifications' element={<Notifications/>} />
          <Route path='/exchanges' element={<ExchangePage />} />
          <Route path='/exchanges/:id' element={<ExchangeDetails />} />
          <Route path='/complaints' element={<ComplaintPage />} />
          <Route path='/complaints/exchange/:exchangeId' element={<ComplaintPage />} />
        </Routes>
      </div>
    </>
  )
}

export default App
