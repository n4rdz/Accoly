// ============================================
// QUIZ DATA - ALL QUESTIONS & MODULES
// ============================================

const QUIZ_MODULES = [
    {
        id: 1,
        name: 'Financial Accounting',
        subject: 'Financial Accounting',
        difficulty: 'Easy',
        color: 'from-blue-500 to-blue-600',
        icon: '📊'
    },
    {
        id: 2,
        name: 'Cost Accounting',
        subject: 'Cost Accounting',
        difficulty: 'Medium',
        color: 'from-purple-500 to-purple-600',
        icon: '💰'
    },
    {
        id: 3,
        name: 'Auditing',
        subject: 'Auditing',
        difficulty: 'Hard',
        color: 'from-green-500 to-green-600',
        icon: '🔍'
    },
    {
        id: 4,
        name: 'Taxation',
        subject: 'Taxation',
        difficulty: 'Medium',
        color: 'from-orange-500 to-orange-600',
        icon: '📋'
    },
    {
        id: 5,
        name: 'Business Law',
        subject: 'Business Law',
        difficulty: 'Easy',
        color: 'from-red-500 to-red-600',
        icon: '⚖️'
    },
    {
        id: 6,
        name: 'Economics',
        subject: 'Economics',
        difficulty: 'Medium',
        color: 'from-cyan-500 to-cyan-600',
        icon: '📈'
    },
    {
        id: 7,
        name: 'Management Advisory Services',
        subject: 'MAS',
        difficulty: 'Super Hard',
        color: 'from-indigo-500 to-indigo-600',
        icon: '💼'
    }
];

const QUIZ_QUESTIONS = {
    1: [ // Financial Accounting
        {
            id: 1,
            question: 'What is the primary purpose of the Balance Sheet?',
            options: [
                'A) To show company profitability',
                'B) To show financial position at a specific date',
                'C) To show cash flow during a period',
                'D) To show operating expenses'
            ],
            correct: 1,
            explanation: 'The Balance Sheet shows the financial position at a specific point in time by listing assets, liabilities, and equity.'
        },
        {
            id: 2,
            question: 'Which principle states that accounting records should reflect the true financial position?',
            options: [
                'A) Materiality principle',
                'B) True and fair view principle',
                'C) Going concern principle',
                'D) Consistency principle'
            ],
            correct: 1,
            explanation: 'The True and Fair View principle requires that financial statements show a fair representation of financial position.'
        },
        {
            id: 3,
            question: 'What does GAAP stand for?',
            options: [
                'A) Generally Approved Accounting Principles',
                'B) Generally Accepted Accounting Principles',
                'C) General Accounting Association Practices',
                'D) Global Accounting and Audit Practices'
            ],
            correct: 1,
            explanation: 'GAAP refers to Generally Accepted Accounting Principles, the standard accounting rules and procedures.'
        },
        {
            id: 4,
            question: 'Which account classification is most liquid?',
            options: [
                'A) Fixed Assets',
                'B) Intangible Assets',
                'C) Current Assets',
                'D) Investments'
            ],
            correct: 2,
            explanation: 'Current Assets are the most liquid, as they can be converted to cash within one year.'
        },
        {
            id: 5,
            question: 'Double-entry bookkeeping requires that:',
            options: [
                'A) Every debit has a corresponding credit',
                'B) Every transaction affects two accounts',
                'C) Debits equal credits',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'All three statements are correct - double-entry bookkeeping ensures balanced records.'
        },
        {
            id: 6,
            question: 'What is depreciation?',
            options: [
                'A) Decrease in value of assets over time',
                'B) Allocation of asset cost over useful life',
                'C) Loss due to obsolescence',
                'D) Reduction in market value'
            ],
            correct: 1,
            explanation: 'Depreciation is the systematic allocation of an asset\'s cost over its useful life.'
        },
        {
            id: 7,
            question: 'Deferred revenue is classified as:',
            options: [
                'A) Assets',
                'B) Liabilities',
                'C) Equity',
                'D) Expenses'
            ],
            correct: 1,
            explanation: 'Deferred revenue (advance payments) is a liability until goods/services are delivered.'
        },
        {
            id: 8,
            question: 'What does the Income Statement primarily measure?',
            options: [
                'A) Financial position',
                'B) Profitability',
                'C) Cash flow',
                'D) Asset value'
            ],
            correct: 1,
            explanation: 'The Income Statement measures profitability by showing revenues minus expenses.'
        },
        {
            id: 9,
            question: 'Which ratio measures profitability relative to assets?',
            options: [
                'A) Return on Equity (ROE)',
                'B) Return on Assets (ROA)',
                'C) Debt-to-Equity',
                'D) Current Ratio'
            ],
            correct: 1,
            explanation: 'Return on Assets (ROA) measures how efficiently assets are used to generate profit.'
        },
        {
            id: 10,
            question: 'Accounts Receivable is classified as:',
            options: [
                'A) Liability',
                'B) Asset',
                'C) Equity',
                'D) Expense'
            ],
            correct: 1,
            explanation: 'Accounts Receivable represents money owed by customers, which is an asset.'
        }
    ],
    2: [ // Cost Accounting
        {
            id: 1,
            question: 'What is the primary purpose of cost accounting?',
            options: [
                'A) To calculate product costs',
                'B) To aid in decision-making',
                'C) To control costs',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'Cost accounting serves all these purposes - calculating costs, aiding decisions, and controlling costs.'
        },
        {
            id: 2,
            question: 'Fixed costs remain constant regardless of:',
            options: [
                'A) Production volume',
                'B) Time period',
                'C) Material prices',
                'D) Labor availability'
            ],
            correct: 0,
            explanation: 'Fixed costs remain constant regardless of production volume changes.'
        },
        {
            id: 3,
            question: 'What is the break-even point?',
            options: [
                'A) Maximum profit point',
                'B) Where revenue equals total costs',
                'C) Minimum production level',
                'D) Point of maximum efficiency'
            ],
            correct: 1,
            explanation: 'The break-even point is where total revenue equals total costs, resulting in zero profit/loss.'
        },
        {
            id: 4,
            question: 'Which method allocates overhead based on activity levels?',
            options: [
                'A) Traditional costing',
                'B) Activity-based costing',
                'C) Job costing',
                'D) Process costing'
            ],
            correct: 1,
            explanation: 'Activity-based costing allocates overhead based on activities that drive costs.'
        },
        {
            id: 5,
            question: 'Gross profit is calculated as:',
            options: [
                'A) Revenue - COGS',
                'B) Revenue - All Expenses',
                'C) Revenue - Fixed Costs',
                'D) Revenue - Variable Costs'
            ],
            correct: 0,
            explanation: 'Gross Profit = Revenue - Cost of Goods Sold (COGS).'
        },
        {
            id: 6,
            question: 'What is the contribution margin?',
            options: [
                'A) Gross profit',
                'B) Revenue minus variable costs',
                'C) Net profit',
                'D) Operating income'
            ],
            correct: 1,
            explanation: 'Contribution Margin = Revenue - Variable Costs, available to cover fixed costs and profit.'
        },
        {
            id: 7,
            question: 'Material variance is calculated as:',
            options: [
                'A) (Standard - Actual) × Actual Quantity',
                'B) (Actual - Standard) × Standard Quantity',
                'C) Standard Price × Actual Quantity',
                'D) Actual Price × Standard Quantity'
            ],
            correct: 0,
            explanation: 'Material Variance = (Standard Price - Actual Price) × Actual Quantity.'
        },
        {
            id: 8,
            question: 'Which is a period cost?',
            options: [
                'A) Raw materials',
                'B) Direct labor',
                'C) Administrative expense',
                'D) Manufacturing overhead'
            ],
            correct: 2,
            explanation: 'Administrative and selling expenses are period costs, not product costs.'
        },
        {
            id: 9,
            question: 'In process costing, equivalent units are calculated to:',
            options: [
                'A) Track production stage',
                'B) Allocate costs to partially completed units',
                'C) Measure efficiency',
                'D) Control waste'
            ],
            correct: 1,
            explanation: 'Equivalent units help allocate costs to partially completed work in progress.'
        },
        {
            id: 10,
            question: 'What is abnormal spoilage?',
            options: [
                'A) Normal wastage in production',
                'B) Spoilage beyond acceptable levels',
                'C) Planned obsolescence',
                'D) Quality control rejection'
            ],
            correct: 1,
            explanation: 'Abnormal spoilage is spoilage beyond expected levels and is treated as a loss.'
        }
    ],
    3: [ // Auditing - Hard questions
        {
            id: 1,
            question: 'What is the primary objective of an audit?',
            options: [
                'A) To prevent fraud',
                'B) To express an opinion on financial statements',
                'C) To ensure internal controls',
                'D) To detect all errors'
            ],
            correct: 1,
            explanation: 'The primary objective is to express an opinion on whether financial statements are fairly stated.'
        },
        {
            id: 2,
            question: 'Materiality in auditing is:',
            options: [
                'A) The substance of a transaction',
                'B) The level at which misstatements would influence decisions',
                'C) The audit fee',
                'D) The size of the company'
            ],
            correct: 1,
            explanation: 'Materiality is the threshold at which misstatements would influence economic decisions.'
        },
        {
            id: 3,
            question: 'What is the auditor\'s responsibility regarding fraud?',
            options: [
                'A) Guarantee detection of all fraud',
                'B) Design audit to detect material fraud',
                'C) Ensure complete fraud prevention',
                'D) Report all suspicions'
            ],
            correct: 1,
            explanation: 'Auditors design procedures to detect material fraud but cannot guarantee detection.'
        },
        {
            id: 4,
            question: 'What does an unqualified audit opinion mean?',
            options: [
                'A) The company has no issues',
                'B) Financial statements are fairly presented',
                'C) No audit adjustments were made',
                'D) No internal control weaknesses'
            ],
            correct: 1,
            explanation: 'Unqualified opinion means financial statements are fairly presented in all material respects.'
        },
        {
            id: 5,
            question: 'What is sampling risk in auditing?',
            options: [
                'A) Risk of error in testing',
                'B) Risk that sample doesn\'t represent population',
                'C) Risk of selecting wrong items',
                'D) Risk of audit failure'
            ],
            correct: 1,
            explanation: 'Sampling risk is the risk that conclusions from a sample differ from the whole population.'
        },
        {
            id: 6,
            question: 'Internal control over financial reporting includes:',
            options: [
                'A) Segregation of duties',
                'B) Authorization procedures',
                'C) Reconciliation procedures',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'All these elements are essential components of internal control.'
        },
        {
            id: 7,
            question: 'What is analytical procedures in auditing?',
            options: [
                'A) Analyzing financial ratios',
                'B) Evaluating relationships between financial data',
                'C) Statistical analysis',
                'D) Forensic analysis'
            ],
            correct: 1,
            explanation: 'Analytical procedures evaluate relationships and trends in financial and non-financial data.'
        },
        {
            id: 8,
            question: 'What does an audit evidence gathering procedure provide?',
            options: [
                'A) Absolute certainty',
                'B) Reasonable assurance',
                'C) Complete verification',
                'D) Absolute proof'
            ],
            correct: 1,
            explanation: 'Audits provide reasonable assurance, not absolute certainty or complete verification.'
        },
        {
            id: 9,
            question: 'Going concern assessment is performed to ensure:',
            options: [
                'A) The company is profitable',
                'B) The entity will continue operations',
                'C) Assets are fairly valued',
                'D) Liabilities are current'
            ],
            correct: 1,
            explanation: 'Going concern assessment evaluates whether the company can continue operations.'
        },
        {
            id: 10,
            question: 'What is the purpose of audit working papers?',
            options: [
                'A) To document audit procedures',
                'B) To support audit conclusions',
                'C) To provide evidence of audit',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'Working papers document procedures, support conclusions, and provide evidence.'
        }
    ],
    4: [ // Taxation
        {
            id: 1,
            question: 'What is the basic purpose of taxation?',
            options: [
                'A) Revenue generation for government',
                'B) Economic management',
                'C) Social welfare distribution',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'Taxation serves multiple purposes including revenue, economic management, and social policy.'
        },
        {
            id: 2,
            question: 'A progressive tax system means:',
            options: [
                'A) Tax increases with income',
                'B) Same tax rate for all',
                'C) Fixed tax amount',
                'D) Tax decreases with income'
            ],
            correct: 0,
            explanation: 'Progressive tax increases in rate as income increases.'
        },
        {
            id: 3,
            question: 'What is the difference between tax evasion and tax avoidance?',
            options: [
                'A) Both are illegal',
                'B) Evasion is illegal, avoidance is legal',
                'C) Avoidance is illegal, evasion is legal',
                'D) Both are legal'
            ],
            correct: 1,
            explanation: 'Tax evasion is illegal; tax avoidance uses legal means to reduce tax liability.'
        },
        {
            id: 4,
            question: 'Gross income includes:',
            options: [
                'A) Only salary',
                'B) All income less exemptions',
                'C) All income from whatever source derived',
                'D) Investment income only'
            ],
            correct: 2,
            explanation: 'Gross income includes all income from all sources unless specifically exempted.'
        },
        {
            id: 5,
            question: 'Which is a deductible business expense?',
            options: [
                'A) Personal expenses',
                'B) Entertainment with clients',
                'C) Salaries and wages',
                'D) Both B and C'
            ],
            correct: 3,
            explanation: 'Deductible business expenses include salaries and reasonable business entertainment.'
        },
        {
            id: 6,
            question: 'What is a tax deduction?',
            options: [
                'A) A tax credit',
                'B) An amount reducing taxable income',
                'C) A tax rate reduction',
                'D) A refund'
            ],
            correct: 1,
            explanation: 'A deduction is an amount subtracted from gross income to compute taxable income.'
        },
        {
            id: 7,
            question: 'Depreciation for tax purposes is:',
            options: [
                'A) Actual decline in value',
                'B) Allowable deduction for asset cost recovery',
                'C) Market value decrease',
                'D) Physical wear and tear'
            ],
            correct: 1,
            explanation: 'Tax depreciation is an allowable deduction for the cost recovery of assets.'
        },
        {
            id: 8,
            question: 'A tax credit is:',
            options: [
                'A) Same as a deduction',
                'B) A direct reduction in tax liability',
                'C) A deferred payment',
                'D) A tax incentive'
            ],
            correct: 1,
            explanation: 'A tax credit directly reduces tax liability dollar-for-dollar.'
        },
        {
            id: 9,
            question: 'Capital gains are taxed at:',
            options: [
                'A) The same rate as ordinary income',
                'B) A preferential rate',
                'C) No tax',
                'D) A punitive rate'
            ],
            correct: 1,
            explanation: 'Capital gains typically receive preferential tax treatment compared to ordinary income.'
        },
        {
            id: 10,
            question: 'What is a loss carryforward?',
            options: [
                'A) A tax loss used in current year',
                'B) A loss applied to future years',
                'C) A permanent loss',
                'D) A business failure'
            ],
            correct: 1,
            explanation: 'A loss carryforward allows unused losses to be applied to reduce taxes in future years.'
        }
    ],
    5: [ // Business Law
        {
            id: 1,
            question: 'What is a contract?',
            options: [
                'A) An agreement between parties',
                'B) A binding agreement with consideration',
                'C) A written document',
                'D) A promise'
            ],
            correct: 1,
            explanation: 'A contract is a binding agreement between parties with offer, acceptance, and consideration.'
        },
        {
            id: 2,
            question: 'Consideration in a contract means:',
            options: [
                'A) Careful thought',
                'B) Something of value exchanged',
                'C) Thoughtfulness',
                'D) Respect'
            ],
            correct: 1,
            explanation: 'Consideration is something of value that each party gives in exchange.'
        },
        {
            id: 3,
            question: 'A partnership is:',
            options: [
                'A) A single legal entity',
                'B) An agreement between two or more persons',
                'C) A corporation',
                'D) A trust'
            ],
            correct: 1,
            explanation: 'A partnership is an agreement between two or more persons to share profits.'
        },
        {
            id: 4,
            question: 'In a corporation, shareholders\' liability is:',
            options: [
                'A) Unlimited',
                'B) Limited to their investment',
                'C) Joint and several',
                'D) Personal'
            ],
            correct: 1,
            explanation: 'Shareholders in a corporation have limited liability to their investment amount.'
        },
        {
            id: 5,
            question: 'What is intellectual property?',
            options: [
                'A) Knowledge',
                'B) Patents, trademarks, copyrights',
                'C) Business ideas',
                'D) Information'
            ],
            correct: 1,
            explanation: 'Intellectual property includes patents, trademarks, copyrights, and trade secrets.'
        },
        {
            id: 6,
            question: 'A warranty in sales law is:',
            options: [
                'A) A guarantee',
                'B) An assurance of quality',
                'C) A promise about product',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'A warranty is an assurance or guarantee about product quality and performance.'
        },
        {
            id: 7,
            question: 'Negligence requires:',
            options: [
                'A) Intent to harm',
                'B) Duty, breach, causation, damages',
                'C) Malice',
                'D) Fault only'
            ],
            correct: 1,
            explanation: 'Negligence requires duty of care, breach, causation, and resulting damages.'
        },
        {
            id: 8,
            question: 'A contract becomes void when:',
            options: [
                'A) Both parties wish to cancel',
                'B) One party wants to cancel',
                'C) There is legal impediment',
                'D) Time passes'
            ],
            correct: 2,
            explanation: 'A contract is void when there is a legal impediment (fraud, duress, illegality).'
        },
        {
            id: 9,
            question: 'What is specific performance?',
            options: [
                'A) Excellent work',
                'B) Court order to perform contract',
                'C) Performance evaluation',
                'D) Task completion'
            ],
            correct: 1,
            explanation: 'Specific performance is a court order requiring a party to perform contract obligations.'
        },
        {
            id: 10,
            question: 'A bailment is:',
            options: [
                'A) A loan',
                'B) Temporary possession of another\'s property',
                'C) Ownership transfer',
                'D) A purchase'
            ],
            correct: 1,
            explanation: 'A bailment is the temporary possession of another\'s property for a specific purpose.'
        }
    ],
    6: [ // Economics
        {
            id: 1,
            question: 'Economics is the study of:',
            options: [
                'A) Money and banking',
                'B) Scarcity and choice',
                'C) Business only',
                'D) Government policies'
            ],
            correct: 1,
            explanation: 'Economics studies how societies allocate scarce resources among unlimited wants.'
        },
        {
            id: 2,
            question: 'Supply and demand curves intersect at:',
            options: [
                'A) Maximum price',
                'B) Equilibrium price',
                'C) Minimum price',
                'D) Market failure'
            ],
            correct: 1,
            explanation: 'The intersection represents market equilibrium where quantity supplied equals quantity demanded.'
        },
        {
            id: 3,
            question: 'Inflation means:',
            options: [
                'A) Increase in income',
                'B) Increase in price levels',
                'C) Increase in production',
                'D) Increase in employment'
            ],
            correct: 1,
            explanation: 'Inflation is a sustained increase in the general price level of goods and services.'
        },
        {
            id: 4,
            question: 'Opportunity cost is:',
            options: [
                'A) The cost of production',
                'B) The next best alternative forgone',
                'C) The cost of opportunity',
                'D) A lost business chance'
            ],
            correct: 1,
            explanation: 'Opportunity cost is the value of the next best alternative given up.'
        },
        {
            id: 5,
            question: 'GDP measures:',
            options: [
                'A) Government spending',
                'B) Gross total output',
                'C) Total market value of goods/services',
                'D) National debt'
            ],
            correct: 2,
            explanation: 'GDP is the total market value of final goods and services produced in a country.'
        },
        {
            id: 6,
            question: 'Comparative advantage means:',
            options: [
                'A) Producing more efficiently',
                'B) Lower opportunity cost',
                'C) Better quality products',
                'D) Price leadership'
            ],
            correct: 1,
            explanation: 'Comparative advantage means producing at a lower opportunity cost.'
        },
        {
            id: 7,
            question: 'Elasticity of demand measures:',
            options: [
                'A) Product quality',
                'B) Price responsiveness of quantity demanded',
                'C) Supply changes',
                'D) Income changes'
            ],
            correct: 1,
            explanation: 'Elasticity measures how quantity demanded responds to price changes.'
        },
        {
            id: 8,
            question: 'Marginal utility is:',
            options: [
                'A) Total satisfaction',
                'B) Additional satisfaction from one more unit',
                'C) Average satisfaction',
                'D) Maximum satisfaction'
            ],
            correct: 1,
            explanation: 'Marginal utility is the additional satisfaction gained from consuming one more unit.'
        },
        {
            id: 9,
            question: 'Consumer surplus is:',
            options: [
                'A) Extra money consumers have',
                'B) Excess goods produced',
                'C) Difference between price paid and willingness to pay',
                'D) Total consumer spending'
            ],
            correct: 2,
            explanation: 'Consumer surplus is the difference between what consumers pay and what they\'re willing to pay.'
        },
        {
            id: 10,
            question: 'Recession is characterized by:',
            options: [
                'A) Declining GDP',
                'B) Rising unemployment',
                'C) Reduced consumer spending',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'Recession involves declining GDP, rising unemployment, and reduced economic activity.'
        }
    ],
    7: [ // Management Advisory Services
        {
            id: 1,
            question: 'MAS primarily focuses on:',
            options: [
                'A) Compliance auditing',
                'B) Adding value through advice',
                'C) Financial auditing',
                'D) Tax preparation'
            ],
            correct: 1,
            explanation: 'MAS focuses on providing management advice to improve business operations and decision-making.'
        },
        {
            id: 2,
            question: 'Business process improvement involves:',
            options: [
                'A) Cost reduction only',
                'B) Redesigning activities for efficiency',
                'C) Staff reduction',
                'D) Technology replacement'
            ],
            correct: 1,
            explanation: 'Process improvement focuses on redesigning and optimizing business activities.'
        },
        {
            id: 3,
            question: 'What is business strategy?',
            options: [
                'A) Daily operations plan',
                'B) Long-term direction and objectives',
                'C) Marketing plan',
                'D) Financial forecast'
            ],
            correct: 1,
            explanation: 'Strategy defines long-term direction, goals, and competitive positioning.'
        },
        {
            id: 4,
            question: 'SWOT analysis includes:',
            options: [
                'A) Strengths and weaknesses only',
                'B) Opportunities and threats only',
                'C) All internal and external factors',
                'D) Financial metrics only'
            ],
            correct: 2,
            explanation: 'SWOT examines internal strengths/weaknesses and external opportunities/threats.'
        },
        {
            id: 5,
            question: 'Risk management in MAS involves:',
            options: [
                'A) Identifying risks',
                'B) Assessing impacts',
                'C) Implementing controls',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'Risk management encompasses identification, assessment, and mitigation.'
        },
        {
            id: 6,
            question: 'A cost-benefit analysis determines:',
            options: [
                'A) Project viability',
                'B) Whether benefits exceed costs',
                'C) ROI potential',
                'D) All of the above'
            ],
            correct: 3,
            explanation: 'Cost-benefit analysis evaluates if project benefits justify the investment.'
        },
        {
            id: 7,
            question: 'Systems thinking in MAS means:',
            options: [
                'A) Understanding individual components',
                'B) Viewing organization holistically',
                'C) Technology focus',
                'D) Data analysis only'
            ],
            correct: 1,
            explanation: 'Systems thinking examines how organization components interact as a whole.'
        },
        {
            id: 8,
            question: 'Performance measurement in MAS includes:',
            options: [
                'A) Financial metrics only',
                'B) Financial and non-financial KPIs',
                'C) Production metrics',
                'D) Sales targets'
            ],
            correct: 1,
            explanation: 'Performance measurement uses balanced financial and non-financial indicators.'
        },
        {
            id: 9,
            question: 'Change management addresses:',
            options: [
                'A) Technology changes only',
                'B) Organizational and people changes',
                'C) Process documentation',
                'D) Policy updates'
            ],
            correct: 1,
            explanation: 'Change management involves managing organizational, process, and people transitions.'
        },
        {
            id: 10,
            question: 'Business intelligence in MAS involves:',
            options: [
                'A) Data collection only',
                'B) Converting data to actionable insights',
                'C) Market research',
                'D) Competitive analysis only'
            ],
            correct: 1,
            explanation: 'Business intelligence transforms data into insights for strategic decision-making.'
        }
    ]
};
