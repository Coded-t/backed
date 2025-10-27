# CBE Test System Backend

Backend API for the CBE (Computer Based Examination) Mobile Application.

## Features

- User authentication (Students and Teachers)
- Course management
- Test creation with multiple question types (Multiple Choice, Dropdown, Checkbox, Written)
- Automatic test timing and auto-submission
- Result grading and publishing (with 7-hour delay)
- MongoDB database integration

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cbe_test_system
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/search?search=keyword` - Search courses
- `GET /api/courses/my-courses` - Get my courses (protected)
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (teacher only)

### Tests
- `GET /api/tests` - Get all tests
- `GET /api/tests/available` - Get available tests (student)
- `GET /api/tests/course/:courseId` - Get tests by course
- `GET /api/tests/:id` - Get single test
- `POST /api/tests` - Create test (teacher only)
- `POST /api/tests/:id/start` - Start a test (student)

### Results
- `GET /api/results/my-results` - Get my results
- `GET /api/results/attempt/:attemptId` - Get attempt details
- `POST /api/results/attempt/:attemptId/submit` - Submit test
- `PUT /api/results/attempt/:attemptId/answer` - Save answer
- `POST /api/results/publish/:attemptId` - Publish result (teacher)
- `POST /api/results/auto-submit` - Auto-submit expired tests

## Project Structure

```
backend/
├── controllers/     # Route controllers
├── middleware/      # Authentication middleware
├── models/          # MongoDB models
├── routes/          # Express routes
├── utils/           # Utility functions
├── server.js        # Main server file
└── package.json     # Dependencies
```

## Question Types

- **multiple-choice**: Single select with radio buttons
- **dropdown**: Select from dropdown menu
- **checkbox**: Multiple select with checkboxes
- **written**: Text input for manual grading

## Test Flow

1. Teacher creates a test with questions, duration, and availability window
2. Student logs in and searches for courses/tests
3. Student starts a test (timer begins)
4. Student answers questions during the test
5. Test auto-submits when timer expires or student submits manually
6. System auto-grades objective questions
7. Results published after 7 hours (or when teacher publishes)
8. Student views results

## Database Models

- **User**: Students and teachers
- **Course**: Course information
- **Test**: Test questions and settings
- **TestAttempt**: Student test attempts and results



mongodb+srv://tbellohar_db_user:bDWU9VzlZyaAsjM3@mobile0.10jgshz.mongodb.net/?appName=mobile0


