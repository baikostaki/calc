"use strict";
let eps = 0.000001; //used for comparison of floats, not sure If that much precision is needed
let count = 0; // remove when deleting the things in gitcalculateInstallment(loan)

const config = {
    decimalPrecision: 2,
}
//config
const roundType = {
    PRECISION: "precision", //to make sure 10 / 3 * 3 = 10;
    DECIMALS: "decimals",
    NONE: "none",
}

Object.freeze(roundType);

// ideally we would have a class Loan with Methods to calculate the 4 parameters.
// I imagine to use it as Loan.CalcParameter("calculationType") for each parameter Type we would call a different calculation method
const calculationType = {
    PRINCIPAL: "principal",
    TERM: "term",
    APR: "apr",
    INSTALLMENT: "installment",
}

// Should be refactored to a class with methods
let loan = {
    calcType: "", // for printing/debugging, not needed for calculations
    principal: 75000, //calculate by using calculateLoanPrincipal();
    term: 60, //calculate using calculateLoanTerm();
    interestRate: 0.045, //calculated with TODO:
    installment: 0, //calculate by using calculateInstallment();
    annualCostsPercentageRate: 0
}

// UNIT TESTS
let loan1 = ["installment", 75000, 60, 0.045, 0, 0];
loan1 = createLoan(loan1);
loan1.installment = calculateInstallment(loan1);
console.log(loan1);

let loan2 = ["principal", 75000, 60, 0.045, 1398, 0];
loan2 = createLoan(loan2);
loan2.principal = calculateLoanPrincipal(loan2);
console.log(loan2);

let loan3 = ["term", 75000, 60, 0.045, loan1.installment, 0];
loan3 = createLoan(loan3);
loan3.term = calculateLoanTerm(loan3);
console.log(loan3);

let loan4 = ["interest rate", 75000, 60, 0, loan1.installment, 0];
loan4 = createLoan(loan4);
loan4.interestRate = calculateInterestRate(loan4);
console.log(loan4);

let loan5 = ["interest rate", 75000, 60, 0.045, loan1.installment, 0];
loan5 = createLoan(loan5);
let loan5taxes = {
    initial: 120,
    periodical: [
        {
            type: "fixed",
            amount: 2,
            period: 1
        },
        {
            type: "fixed",
            amount: 300,
            period: 12
        },
        {
            type: "percentage",
            amount: 0.02,
            period: 12
        }
    ]
}
loan5.annualCostsPercentageRate = calculateAnnualCostsPercentageRate(loan5, loan5taxes);
console.log(loan5);

// FOR EASIER TESTING AND DELETION OF UNNEEDED CODE
function createLoan(loanParams) {
    let tempLoan = {...loan};
    for (let j = 0; j < Object.keys(tempLoan).length; j++) {
        tempLoan[Object.keys(tempLoan)[j]] = loanParams[j];
    }
    return tempLoan;
}

function customRound(type, val) {
    switch (type) {
        case roundType.DECIMALS:
            let decimals = config["decimalPrecision"];
            val = Math.round(val * 10 ** decimals) / (10 ** decimals);
            return val;
            break;
        case roundType.PRECISION:
            if ((Math.abs(Math.round(val) - val) < eps)) {
                val = Math.round(val);
            }
            return val;
            break;
        case roundType.NONE:
            return val;
            break;
        default:
            break;
    }
}


function calculateLoanPrincipal(loan) {
    let monthlyInterestRate = loan.interestRate / 12;
    let monthlyInterestFactor = 1 + monthlyInterestRate;
    let result = loan.installment / monthlyInterestRate * (1 - monthlyInterestFactor ** (-loan.term));
    loan.calcType = "principal";
    return customRound(roundType.NONE, result);
}

function calculateLoanTerm(loan) {
    let monthlyInterestRate = loan.interestRate / 12;
    let monthlyInterestFactor = 1 + monthlyInterestRate;
    let result = (Math.log(loan.installment) - Math.log(loan.installment - loan.principal * monthlyInterestRate)) / Math.log(monthlyInterestFactor);
    loan.calcType = "term";
    return customRound(roundType.NONE, result);
}

function calculateInstallment(loan) {
    let monthlyInterestRate = loan.interestRate / 12;
    let monthlyInterestFactor = 1 + monthlyInterestRate;
    let result = (loan.principal * monthlyInterestRate) / (1 - (monthlyInterestFactor) ** (-loan.term))
    loan.calcType = "installment";
    //TODO: remove from code after testing
    //console.log(calculateInstallment.caller); (doesn't work in strict mode since ES5 :(
    count+=1;
    if (count > 1){
        loan.calcType = "ГПР"
    }
    //REMOVE UNTIL HERE
    return customRound(roundType.NONE, result);
}

function calculateInterestRate(loan) {
    let cashflow = [-loan.principal];
    for (let i = 0; i < loan.term; ++i) {
        cashflow.push(loan.installment);
    }

    let monthlyInterestRate = IRR(cashflow);
    let result = monthlyInterestRate * 12;
    return customRound(roundType.NONE, result);
}


console.log(`\n===INTEREST RATE CHECK===`);

function calculateOutstandingAmount(loan, nper) {
    let pmt = calculateInstallment(loan);
    let i = loan.interestRate / 12;
    let q = 1 + i;
    let n = nper;
    let p = loan.principal;
    let balance = p * q ** n - pmt / i * (q ** n - 1);
    return balance;
}

let balance = calculateOutstandingAmount(loan, 60);
/*when your Loan parameters are right, the balance (outstanding amount,
after you paid the last installment should be damn close to zero.*/
console.log(`balance is ${balance}`);
if (balance < eps) {
    console.log("your loan is OK")
}

//all below is for GPR calculation
function calculateAnnualCostsPercentageRate(loan, taxes) {

    let initialTax = taxes["initial"];
    let cashflows = [];

    cashflows.push(-loan.principal + initialTax);
    for (let i = 0; i < loan.term; ++i) {
        let taxAmount = 0;
        for (const taxType in taxes) {
            if (taxType == "periodical") {
                for (const currentTax of taxes[taxType]) {
                    if (currentTax.type === 'fixed') {
                        if (currentTax.period === 1) {
                            taxAmount += currentTax.amount;
                        }

                        if (currentTax.period > 1 && i > 0 && currentTax.period % i == 0) {
                            if (i == 1) {
                                continue;
                            }
                            taxAmount += currentTax.amount
                        }
                    }

                    if (currentTax.type === 'percentage') {
                        if (i > 0 && i % currentTax.period == 0) {
                            let currentBalance = calculateOutstandingAmount(loan, i);
                            let anotherType = "taxOnOutstandingAmount"
                            if (anotherType == "taxOnOutstandingAmount") {
                                taxAmount += currentTax.amount * currentBalance
                            }

                            // or "taxOnPrincipalPayment
                            // let interestPart = currentTax * loan.interestRate;
                            // let principalPart = loan.installment - interestPart;
                            // taxAmount += currentTax.amount * principalPart
                        }
                    }
                }
            }
        }
        cashflows.push(loan.installment + taxAmount)
    }


    let irr = IRR(cashflows, 0.1)     //0.1 is guess value, usually by default is 0.1
    loan.annualCostsPercentageRate = (1 + irr) ** 12 - 1
    return customRound(roundType.NONE, loan.annualCostsPercentageRate)
}


//https://gist.github.com/ghalimi/4591338
function IRR(values, guess) {
    // Credits: algorithm inspired by Apache OpenOffice

    // Calculates the resulting amount
    var irrResult = function (values, dates, rate) {
        var r = rate + 1;
        var result = values[0];
        for (var i = 1; i < values.length; i++) {
            result += values[i] / Math.pow(r, (dates[i] - dates[0]) / 365);
        }
        return result;
    }

    // Calculates the first derivation
    var irrResultDeriv = function (values, dates, rate) {
        var r = rate + 1;
        var result = 0;
        for (var i = 1; i < values.length; i++) {
            var frac = (dates[i] - dates[0]) / 365;
            result -= frac * values[i] / Math.pow(r, frac + 1);
        }
        return result;
    }

    // Initialize dates and check that values contains at least one positive value and one negative value
    var dates = [];
    var positive = false;
    var negative = false;
    for (var i = 0; i < values.length; i++) {
        dates[i] = (i === 0) ? 0 : dates[i - 1] + 365;
        if (values[i] > 0) positive = true;
        if (values[i] < 0) negative = true;
    }

    // Return error if values does not contain at least one positive value and one negative value
    if (!positive || !negative) return '#NUM!';

    // Initialize guess and resultRate
    var guess = (typeof guess === 'undefined') ? 0.1 : guess;
    var resultRate = guess;

    // Set maximum epsilon for end of iteration
    var epsMax = 1e-10;

    // Set maximum number of iterations
    var iterMax = 50;

    // Implement Newton's method
    var newRate, epsRate, resultValue;
    var iteration = 0;
    var contLoop = true;
    do {
        resultValue = irrResult(values, dates, resultRate);
        newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
        epsRate = Math.abs(newRate - resultRate);
        resultRate = newRate;
        contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
    } while (contLoop && (++iteration < iterMax));

    if (contLoop) return '#NUM!';

    // Return internal rate of return
    return resultRate;
}