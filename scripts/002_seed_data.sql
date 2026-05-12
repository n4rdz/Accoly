-- Seed Quiz Modules and Questions for Accountify

-- Insert Quiz Modules
INSERT INTO public.quiz_modules (id, title, description, subject, difficulty, total_questions, passing_score)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Financial Accounting Basics', 'Master the fundamentals of financial accounting', 'Financial Accounting', 'beginner', 10, 70),
  ('550e8400-e29b-41d4-a716-446655440002', 'Advanced Financial Statements', 'Deep dive into complex financial statements', 'Financial Accounting', 'advanced', 15, 75),
  ('550e8400-e29b-41d4-a716-446655440003', 'Cost Accounting Principles', 'Understanding cost management and analysis', 'Cost Accounting', 'intermediate', 12, 70),
  ('550e8400-e29b-41d4-a716-446655440004', 'Taxation Fundamentals', 'Basic tax concepts and calculations', 'Taxation', 'beginner', 10, 65),
  ('550e8400-e29b-41d4-a716-446655440005', 'Audit Standards and Procedures', 'Learn auditing standards and practices', 'Auditing', 'intermediate', 12, 70),
  ('550e8400-e29b-41d4-a716-446655440006', 'Business Law Essentials', 'Key business law concepts for accountants', 'Business Law', 'beginner', 10, 65),
  ('550e8400-e29b-41d4-a716-446655440007', 'Management Services & Advisory', 'Consulting and advisory services overview', 'Management Services', 'intermediate', 12, 70);

-- Insert Financial Accounting Questions
INSERT INTO public.quiz_questions (module_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'What is the accounting equation?', 'Assets = Liabilities + Equity', 'Income - Expenses = Profit', 'Debit = Credit', 'Revenue = Costs', 'A', 'The fundamental accounting equation is Assets = Liabilities + Owner''s Equity.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Which account is credited when cash is received?', 'Cash', 'Revenue', 'Expense', 'Liability', 'A', 'When cash is received, the Cash account (asset) is debited.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'What does depreciation represent?', 'Allocation of asset cost over time', 'Physical wear of assets', 'Decrease in market value', 'Tax deduction', 'A', 'Depreciation is the systematic allocation of an asset''s cost over its useful life.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'In double-entry bookkeeping, how many accounts are affected?', 'One', 'Two or more', 'Three', 'Four', 'B', 'Double-entry bookkeeping involves at least two accounts for every transaction.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'What is the purpose of a trial balance?', 'Test if debits equal credits', 'Determine profit', 'Record transactions', 'Prepare financial statements', 'A', 'A trial balance verifies that total debits equal total credits.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Which financial statement shows assets and liabilities?', 'Balance Sheet', 'Income Statement', 'Cash Flow Statement', 'Statement of Changes', 'A', 'The Balance Sheet presents assets, liabilities, and equity.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'What is a contra account?', 'Account with opposite normal balance', 'Asset account', 'Liability account', 'Equity account', 'A', 'A contra account has a debit or credit balance opposite to its normal balance.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Which method is NOT a depreciation method?', 'Straight-line', 'Declining balance', 'Market value', 'Units of production', 'C', 'Market value is not a standard depreciation method.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'What does accrual accounting record?', 'Transactions when earned/incurred', 'Transactions when cash moves', 'Only cash transactions', 'Only credit transactions', 'A', 'Accrual accounting records transactions when they are earned or incurred, not when cash is received.'),
  ('550e8400-e29b-41d4-a716-446655440001', 'What is a journal entry?', 'First record of a transaction', 'List of all accounts', 'Financial statement', 'Daily transaction log', 'A', 'A journal entry is the first formal record of a business transaction.');

-- Insert Cost Accounting Questions
INSERT INTO public.quiz_questions (module_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'What is the primary focus of cost accounting?', 'Tracking and controlling costs', 'Revenue generation', 'Tax compliance', 'External reporting', 'A', 'Cost accounting focuses on tracking, analyzing, and controlling business costs.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Which cost varies with production volume?', 'Variable cost', 'Fixed cost', 'Mixed cost', 'Sunk cost', 'A', 'Variable costs change with production levels; fixed costs remain constant.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'What is the contribution margin?', 'Sales - Variable Costs', 'Sales - Fixed Costs', 'Profit - Taxes', 'Revenue - Expenses', 'A', 'Contribution margin is Sales Revenue minus Variable Costs.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Which method allocates costs based on actual consumption?', 'Activity-Based Costing', 'Job Costing', 'Process Costing', 'Standard Costing', 'A', 'ABC allocates overhead costs based on actual resource consumption.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'What does break-even point represent?', 'Zero profit or loss', 'Maximum profit', 'Minimum cost', 'Break-even revenue', 'A', 'Break-even point is where total revenue equals total costs.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Which costing method groups costs by department?', 'Process Costing', 'Job Costing', 'Activity-Based Costing', 'Standard Costing', 'A', 'Process costing accumulates costs by department or process.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'What is a cost driver?', 'Activity that causes cost to occur', 'Machine that produces costs', 'Person managing costs', 'Department responsible for costs', 'A', 'A cost driver is an activity that causes costs to be incurred.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'What is the purpose of standard costing?', 'Benchmark for comparison', 'Predict future costs', 'Control actual costs', 'All of the above', 'D', 'Standard costing provides benchmarks for cost control and analysis.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Which is NOT a product cost?', 'Selling expense', 'Raw material', 'Direct labor', 'Manufacturing overhead', 'A', 'Selling expenses are period costs, not product costs.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'What is target costing?', 'Design costs to achieve profit target', 'Cost of target products', 'Targeting cost reduction', 'Cost of target market', 'A', 'Target costing works backwards from desired profit margin.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'What is job order costing?', 'Cost allocation per specific job', 'Overall company cost', 'Cost per production unit', 'Cost of job creation', 'A', 'Job costing tracks costs for specific projects or jobs.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Which variance shows efficiency difference?', 'Quantity variance', 'Price variance', 'Rate variance', 'Budget variance', 'A', 'Quantity variance measures efficiency in resource usage.');

-- Insert sample achievements data
INSERT INTO public.achievements (badge_name, badge_icon, description)
VALUES
  ('Quiz Master', '🏆', 'Completed 10 quizzes'),
  ('Perfect Score', '⭐', 'Achieved 100% on any quiz'),
  ('Study Streak', '🔥', 'Maintained 7-day study streak'),
  ('Fast Learner', '⚡', 'Complete quiz in under 5 minutes'),
  ('Comprehensive Notes', '📚', 'Created 20+ notes'),
  ('All-Rounder', '🎯', 'Completed quizzes in all 7 subjects');
