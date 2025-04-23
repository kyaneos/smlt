from app import db
from flask_login import UserMixin
from datetime import datetime
import json

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # User progress tracking
    progress = db.relationship('Progress', backref='user', lazy=True)
    quiz_results = db.relationship('QuizResult', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'


class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Progress user_id={self.user_id} lesson_id={self.lesson_id}>'


class QuizResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    quiz_id = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Float, nullable=False)  # Percentage correct
    answers = db.Column(db.Text)  # JSON string of question_id:answer_id pairs
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_answers(self, answers_dict):
        self.answers = json.dumps(answers_dict)
        
    def get_answers(self):
        return json.loads(self.answers) if self.answers else {}
    
    def __repr__(self):
        return f'<QuizResult user_id={self.user_id} quiz_id={self.quiz_id} score={self.score}>'
