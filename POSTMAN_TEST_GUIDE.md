# Postman API Test Guide

## Authentication
### Register User
- **Method**: POST  
- **URL**: `/auth/register`  
- **Body** (JSON):  
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

### Login 
- **Method**: POST  
- **URL**: `/auth/login`  
- **Body** (JSON):  
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

### Get Current User 
- **Method**: GET  
- **URL**: `/auth/me`  
- **Headers**:  
  `Authorization: Bearer [JWT_TOKEN]`

---

## Admin - Movie Management
*Requires Admin Authorization Header*

### Create Movie
- **Method**: POST  
- **URL**: `/admin/movies`  
- **Headers**:  
  `Authorization: Bearer [ADMIN_JWT_TOKEN]`  
- **Body** (form-data):  
  - poster: (file)  
  - thumbnail: (file)  
  - trailer: (file)  
  - slug: "movie-slug"  
  - name: "Movie Name"  
  - type: "movie|series"  
  - category: "category_id"

### Update Movie
- **Method**: PUT  
- **URL**: `/admin/movies/:id`  
- **Headers/body**: Same as create

---

## Admin - Category Management
### Create Category
- **Method**: POST  
- **URL**: `/admin/category`  
- **Headers**: Authorization required  
- **Body** (JSON):  
```json
{
    "name": "Action",
    "slug": "action"
}
```

---

## Admin - Episode Management
### Create Episode (with video)
- **Method**: POST  
- **URL**: `/admin/episodes`  
- **Headers**: Authorization + multipart  
- **Body** (form-data):  
  - videoFile: (mp4 file)  
  - thumbnailFile: (image)  
  - movieId: "movie_id"  
  - episodeNumber: 1

---

## Admin - User Management
### Get All Users
- **Method**: GET  
- **URL**: `/admin/users`  
- **Headers**: Admin auth

### Update User Status
- **Method**: PUT  
- **URL**: `/admin/users/:id/status`  
- **Body** (JSON):  
```json
{
    "isActive": true
}
```

---

## Admin - Package Management
### Create Subscription Package
- **Method**: POST  
- **URL**: `/admin/packages`  
- **Headers**: Admin auth  
- **Body** (JSON):  
```json
{
    "name": "Premium",
    "price": 9.99,
    "duration": 30,
    "movies": ["movie_id1", "movie_id2"]
}
