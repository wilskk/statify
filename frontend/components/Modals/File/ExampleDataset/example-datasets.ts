import { ExampleFiles } from './types';

const exampleSavFiles = [
    { 
        name: 'accidents', 
        path: '/exampleData/accidents.sav',
        tags: ['insurance', 'risk', 'automobile', 'accidents', 'age', 'gender'],
        description: 'Hypothetical data file concerning an insurance company studying age and gender risk factors for automobile accidents in a given region. Each case corresponds to a cross-classification of age category and gender.'
    },
    { 
        name: 'adl', 
        path: '/exampleData/adl.sav',
        tags: ['medical', 'healthcare', 'therapy', 'stroke', 'activities', 'daily living'],
        description: 'Hypothetical data file concerning efforts to determine the benefits of a proposed type of therapy for stroke patients. Physicians randomly assigned female stroke patients to one of two groups - standard physical therapy or additional emotional therapy. Three months following treatments, each patient\'s abilities to perform common activities of daily life were scored.'
    },
    { 
        name: 'advert', 
        path: '/exampleData/advert.sav',
        tags: ['marketing', 'advertising', 'sales', 'costs', 'retail'],
        description: 'Hypothetical data file concerning a retailer\'s efforts to examine the relationship between money spent on advertising and the resulting sales. Contains past sales figures and associated advertising costs.'
    },
    { 
        name: 'bankloan', 
        path: '/exampleData/bankloan.sav',
        tags: ['finance', 'loan', 'defaults', 'credit', 'risk', 'financial', 'demographic'],
        description: 'Hypothetical data file concerning a bank\'s efforts to reduce the rate of loan defaults. Contains financial and demographic information on 850 past and prospective customers. The first 700 cases are customers who were previously given loans, and the last 150 cases are prospective customers to classify as good or bad credit risks.'
    },
    { 
        name: 'behavior', 
        path: '/exampleData/behavior.sav',
        tags: ['psychology', 'behavioral', 'survey', 'situations', 'appropriateness'],
        description: 'In a classic example, 52 students were asked to rate combinations of 15 situations and 15 behaviors on a 10-point scale ranging from 0="extremely appropriate" to 9="extremely inappropriate." Averaged over individuals, the values are taken as dissimilarities.'
    },
    { 
        name: 'car_sales', 
        path: '/exampleData/car_sales.sav',
        tags: ['automotive', 'sales', 'estimates', 'prices', 'specifications', 'vehicles'],
        description: 'Hypothetical data file containing sales estimates, list prices, and physical specifications for various makes and models of vehicles. List prices and physical specifications were obtained alternately from edmunds.com and manufacturer sites.'
    },
    { 
        name: 'contacts', 
        path: '/exampleData/contacts.sav',
        tags: ['corporate', 'sales', 'representatives', 'department', 'rank', 'purchases'],
        description: 'Hypothetical data file concerning contact lists for a group of corporate computer sales representatives. Each contact is categorized by department, company ranks, with records of last sale amount, time since last sale, and company size.'
    },
    { 
        name: 'customer_dbase', 
        path: '/exampleData/customer_dbase.sav',
        tags: ['marketing', 'offers', 'responses', 'data warehouse', 'customer base'],
        description: 'Hypothetical data file concerning a company\'s efforts to use information in its data warehouse to make special offers to customers most likely to reply. A subset of the customer base was selected at random and given special offers, with their responses recorded.'
    },
    { 
        name: 'demo', 
        path: '/exampleData/demo.sav',
        tags: ['marketing', 'database', 'mailing', 'offers', 'response', 'demographics'],
        description: 'Hypothetical data file concerning a purchased customer database for mailing monthly offers. Records whether customers responded to the offer, along with various demographic information.'
    },
    { 
        name: 'dietstudy', 
        path: '/exampleData/dietstudy.sav',
        tags: ['medical', 'diet', 'weight', 'triglyceride', 'health', 'study'],
        description: 'Hypothetical data file containing results of a study of the "Stillman diet". Each case corresponds to a separate subject and records pre- and post-diet weights in pounds and triglyceride levels in mg/100 ml.'
    },
    { 
        name: 'dmdata3', 
        path: '/exampleData/dmdata3.sav',
        tags: ['marketing', 'direct', 'demographics', 'purchasing', 'campaign'],
        description: 'Hypothetical data file containing demographic and purchasing information for a direct marketing company. Contains information on contacts who did not receive a test mailing.'
    },
    { 
        name: 'Employee data', 
        path: '/exampleData/Employee data.sav',
        tags: ['hr', 'employee', 'salary', 'gender', 'job', 'category', 'minority', 'education'],
        description: 'Hypothetical employee dataset containing information such as salary, gender, job category, minority classification, and education level.'
    },
    { 
        name: 'german_credit', 
        path: '/exampleData/german_credit.sav',
        tags: ['finance', 'credit', 'machine learning', 'uci', 'risk', 'assessment'],
        description: 'Data file from the "German credit" dataset in the Repository of Machine Learning Databases at the University of California, Irvine.'
    },
    { 
        name: 'insurance_claims', 
        path: '/exampleData/insurance_claims.sav',
        tags: ['insurance', 'fraud', 'claims', 'suspicious', 'detection', 'modeling'],
        description: 'Hypothetical data file concerning an insurance company\'s efforts to build a model for flagging suspicious, potentially fraudulent claims. Each case represents a separate claim.'
    },
    { 
        name: 'ozone', 
        path: '/exampleData/ozone.sav',
        tags: ['environment', 'pollution', 'meteorological', 'ozone', 'concentration', 'prediction'],
        description: 'Data including 330 observations on six meteorological variables for predicting ozone concentration. Contains data on meteorological factors that affect ozone levels.'
    },
    { 
        name: 'patient_los', 
        path: '/exampleData/patient_los.sav',
        tags: ['medical', 'healthcare', 'hospital', 'myocardial infarction', 'heart attack', 'treatment'],
        description: 'Hypothetical data file containing treatment records of patients admitted to the hospital for suspected myocardial infarction (heart attack). Each case corresponds to a separate patient and records variables related to their hospital stay.'
    },
    { 
        name: 'poll_cs_sample', 
        path: '/exampleData/poll_cs_sample.sav',
        tags: ['polling', 'survey', 'public opinion', 'bill', 'legislation', 'voters'],
        description: 'Hypothetical data file containing a sample of voters from a poll concerning public support for a bill before the legislature. Contains inclusion probabilities and sample weights according to a specified sampling plan.'
    },
    { 
        name: 'salesperformance', 
        path: '/exampleData/salesperformance.sav',
        tags: ['training', 'courses', 'evaluation', 'technical', 'tutorial', 'performance'],
        description: 'Hypothetical data file concerning evaluation of two new sales training courses. Sixty employees were divided into three groups receiving different training approaches, and each employee was tested at the end with their score recorded.'
    },
    { 
        name: 'satisf', 
        path: '/exampleData/satisf.sav',
        tags: ['marketing', 'survey', 'customer satisfaction', 'retail', 'locations'],
        description: 'Hypothetical data file concerning a satisfaction survey conducted by a retail company at 4 store locations. 582 customers were surveyed, and each case represents responses from a single customer.'
    },
    { 
        name: 'tcm_kpi', 
        path: '/exampleData/tcm_kpi.sav',
        tags: ['business', 'kpi', 'metrics', 'performance', 'weekly', 'indicators'],
        description: 'Hypothetical data file containing weekly key performance indicators for a business, along with weekly data for controllable metrics over the same time period.'
    },
    { 
        name: 'telco', 
        path: '/exampleData/telco.sav',
        tags: ['telecommunications', 'churn', 'customer', 'service', 'usage', 'demographics'],
        description: 'Hypothetical data file concerning a telecommunications company\'s efforts to reduce churn in their customer base. Each case corresponds to a separate customer and records demographic and service usage information.'
    },
    { 
        name: 'telco_extra', 
        path: '/exampleData/telco_extra.sav',
        tags: ['telecommunications', 'churn', 'customer', 'spending', 'standardized'],
        description: 'Similar to telco.sav but with tenure and log-transformed customer spending variables removed and replaced by standardized log-transformed customer spending variables.'
    },
    { 
        name: 'test_scores', 
        path: '/exampleData/test_scores.sav',
        tags: ['education', 'assessment', 'performance', 'scores', 'testing'],
        description: 'Hypothetical data file containing test scores for educational assessment and performance analysis.'
    },
    { 
        name: 'workprog', 
        path: '/exampleData/workprog.sav',
        tags: ['government', 'employment', 'program', 'disadvantaged', 'placement', 'jobs'],
        description: 'Hypothetical data file concerning a government works program trying to place disadvantaged people into better jobs. A sample of potential program participants were followed, with some randomly selected for enrollment and others not.'
    },
    { 
        name: 'worldsales', 
        path: '/exampleData/worldsales.sav',
        tags: ['business', 'sales', 'revenue', 'continent', 'product', 'global'],
        description: 'Hypothetical data file containing sales revenue by continent and product for global business analysis.'
    },
];

export const exampleFiles: ExampleFiles = {
    sav: exampleSavFiles,
};