import json
import os
from flask import render_template, redirect, url_for, request, session, jsonify, flash
from app import app, db
from models import User, Progress, QuizResult
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
import logging

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Load lesson and quiz data
def load_data(filename):
    file_path = os.path.join(app.static_folder, 'data', filename)
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error loading data from {filename}: {e}")
        return []

# Routes
@app.route('/')
def home():
    lessons = load_data('lessons.json')
    return render_template('home.html', lessons=lessons)

@app.route('/lesson/<int:lesson_id>')
def lesson(lesson_id):
    lessons = load_data('lessons.json')
    
    # Find the requested lesson
    current_lesson = next((l for l in lessons if l['id'] == lesson_id), None)
    
    if not current_lesson:
        flash('Lesson not found!', 'danger')
        return redirect(url_for('home'))
    
    # Find next and previous lessons
    lesson_ids = [l['id'] for l in lessons]
    current_index = lesson_ids.index(lesson_id)
    
    prev_lesson = lessons[current_index - 1] if current_index > 0 else None
    next_lesson = lessons[current_index + 1] if current_index < len(lessons) - 1 else None
    
    # Update progress if user is logged in
    if current_user.is_authenticated:
        progress = Progress.query.filter_by(user_id=current_user.id, lesson_id=lesson_id).first()
        if not progress:
            progress = Progress(user_id=current_user.id, lesson_id=lesson_id)
            db.session.add(progress)
        db.session.commit()
    
    return render_template('lesson.html', 
                         lesson=current_lesson, 
                         prev_lesson=prev_lesson, 
                         next_lesson=next_lesson)

@app.route('/quiz/<int:quiz_id>')
def quiz(quiz_id):
    quizzes = load_data('quizzes.json')
    current_quiz = next((q for q in quizzes if q['id'] == quiz_id), None)
    
    if not current_quiz:
        flash('Quiz not found!', 'danger')
        return redirect(url_for('home'))
    
    return render_template('quiz.html', quiz=current_quiz)

@app.route('/submit_quiz/<int:quiz_id>', methods=['POST'])
def submit_quiz(quiz_id):
    if not current_user.is_authenticated:
        # Store quiz results in session for anonymous users
        session['quiz_result'] = {
            'quiz_id': quiz_id,
            'answers': request.json.get('answers', {}),
            'score': request.json.get('score', 0)
        }
        return jsonify({'success': True, 'message': 'Quiz results saved in session'})
    
    # Save quiz results to database for authenticated users
    answers = request.json.get('answers', {})
    score = request.json.get('score', 0)
    
    quiz_result = QuizResult(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=score
    )
    quiz_result.set_answers(answers)
    
    db.session.add(quiz_result)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Quiz results saved to database'})

@app.route('/progress')
@login_required
def progress():
    lessons = load_data('lessons.json')
    quizzes = load_data('quizzes.json')
    
    # Get user progress
    user_progress = Progress.query.filter_by(user_id=current_user.id).all()
    # Convert Progress objects to serializable dict
    progress_dict = {p.lesson_id: {
        'id': p.id,
        'lesson_id': p.lesson_id,
        'completed': p.completed,
        'last_accessed': p.last_accessed.isoformat() if p.last_accessed else None
    } for p in user_progress}
    
    # Get quiz results
    quiz_results = QuizResult.query.filter_by(user_id=current_user.id).all()
    # Convert QuizResult objects to serializable dict
    quiz_dict = {r.quiz_id: {
        'id': r.id,
        'quiz_id': r.quiz_id,
        'score': r.score,
        'answers': r.get_answers(),
        'completed_at': r.completed_at.isoformat() if r.completed_at else None
    } for r in quiz_results}
    
    return render_template('progress.html', 
                         lessons=lessons, 
                         quizzes=quizzes,
                         progress=progress_dict,
                         quiz_results=quiz_dict)

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('home'))
        
        flash('Invalid username or password', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Check if username or email already exists
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            flash('Username or email already exists', 'danger')
            return render_template('register.html')
        
        # Create new user
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        return redirect(url_for('home'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/references')
def references():
    return render_template('references.html')
