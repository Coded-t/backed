const gradeTest = (testAttempt, test) => {
  let totalScore = 0;
  let correctAnswers = 0;
  
  // Update answers with grading
  const gradedAnswers = testAttempt.answers.map((attemptAnswer) => {
    const question = test.questions.id(attemptAnswer.questionId);
    
    if (!question) {
      return attemptAnswer;
    }
    
    let pointsEarned = 0;
    let isCorrect = false;
    
    if (question.type === 'written') {
      // Written answers need manual grading - teacher will handle this
      pointsEarned = 0;
      isCorrect = false;
    } else if (question.type === 'checkbox' || question.type === 'multiple-choice') {
      // Check if answer is correct
      const userAnswer = Array.isArray(attemptAnswer.answer) 
        ? attemptAnswer.answer.sort().join(',')
        : attemptAnswer.answer;
      
      const correctAnswer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.sort().join(',')
        : question.correctAnswer;
      
      isCorrect = userAnswer === correctAnswer;
      pointsEarned = isCorrect ? (question.points || 1) : 0;
    } else if (question.type === 'dropdown') {
      isCorrect = attemptAnswer.answer === question.correctAnswer;
      pointsEarned = isCorrect ? (question.points || 1) : 0;
    }
    
    if (isCorrect) {
      correctAnswers++;
    }
    
    totalScore += pointsEarned;
    
    return {
      ...attemptAnswer.toObject(),
      isCorrect,
      pointsEarned
    };
  });
  
  const totalPoints = test.totalPoints || test.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const percentage = totalPoints > 0 ? ((totalScore / totalPoints) * 100).toFixed(2) : 0;
  
  return {
    ...testAttempt.toObject(),
    answers: gradedAnswers,
    score: totalScore,
    percentage: parseFloat(percentage),
    totalPoints
  };
};

module.exports = gradeTest;
