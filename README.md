# Recipe Manager 🍳

A full-stack web application that helps you organize and manage your favorite recipe (expecially their links from social media platforms). Never lose track of those amazing recipes you found while scrolling again!

🌐 **[Live Demo](https://recipe-managerrr.onrender.com)** - Try the app now!

## 🌟 Features

### User Management
- **User Registration & Authentication** - Secure account creation and login system
- **JWT-based Authentication** - Token-based security for protected routes
- **User Profile Management** - Edit profile information and change passwords
- **Account Statistics** - Track your recipe collection and account activity

### Recipe Management
- **Add New Recipes** - Store recipe links with detailed information
- **Rich Recipe Data** - Include images, categories, descriptions, prep/cook times, and temperatures
- **Advanced Search & Filtering** - Search by name, description, category, or temperature
- **Category Organization** - Organize recipes by Breakfast, Lunch, Dinner, Dessert, etc.
- **Visual Recipe Cards** - Beautiful card-based layout for mobile devices
- **Table View** - Comprehensive table view for desktop users

### User Experience
- **Responsive Design** - Optimized for both mobile and desktop devices
- **Real-time Toast Notifications** - Instant feedback for user actions
- **Modal-based Editing** - Intuitive popup modals for viewing and editing recipes
- **Image Upload Support** - Upload and display recipe images
- **Secure Recipe Ownership** - Users can only see and manage their own recipes

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** - Progressive JavaScript framework with Composition API
- **Vue Router** - Client-side routing for single-page application
- **Pinia** - State management for user authentication and data
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data storage
- **JWT (jsonwebtoken)** - Authentication and authorization
- **bcrypt** - Password hashing for security
- **CORS** - Cross-origin resource sharing middleware

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Recipes
- `GET /api/recipes` - Get user's recipes (with search/filter)
- `POST /api/recipes` - Create new recipe
- `GET /api/recipes/:id` - Get recipe by ID
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

## 🔒 Security Features

- **Password Hashing** - Bcrypt encryption for secure password storage
- **JWT Authentication** - Stateless token-based authentication
- **Protected Routes** - Middleware protection for sensitive endpoints
- **User Data Isolation** - Users can only access their own recipes
- **Input Validation** - Server-side validation for all user inputs

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Olya092/RecipeManager.git
   cd RecipeManager
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_CONNECTION_STRING=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

5. **Start the application**
   
   Backend (from backend directory):
   ```bash
   npm start
   ```
   
   Frontend (from frontend directory):
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Local Frontend: `http://localhost:5173`
   - Local Backend API: `http://localhost:3000`
   - **Live Application**: [https://recipe-managerrr.onrender.com](https://recipe-managerrr.onrender.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Icons from [Flaticon](https://www.flaticon.com/)
- Placeholder images from [Bento Themes](https://theme-assets.getbento.com/)
- Built with love for food enthusiasts everywhere!🍳 And especially for my mum and in her favourite colours❤️

## 📞 Contact

- **GitHub:** [@Olya092](https://github.com/Olya092)
- **Repository:** [RecipeManager](https://github.com/Olya092/RecipeManager)
- **Live Application:** [https://recipe-managerrr.onrender.com](https://recipe-managerrr.onrender.com)
