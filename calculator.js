"use strict";
let eps = 0.000001; //used for comparison of floats, not sure If that much precision is needed

const roundType = {
    PRECISION: "precision", //to make sure 10 / 3 * 3 = 10;
    DECIMALS: "2",
}

const calculationType = {
    PRINCIPAL: "principal",
    TERM: "term",
    APR: "apr",
    INSTALLMENT: "installment",
}

// Should be refactored to a class with methods
let loan = {
    interestRate: 0.045, //calculated with TODO:
    term: 60, //calculate using calculateLoanTerm();
    principal: 75000, //calculate by using calculateLoanPrincipal();
    installment: 0, //calculate by using calculateInstallment();
    annualCostsPercentage: 0,
}

loan.installment = calculateInstallment(loan);

// BNP's behaviour
if (Math.abs(Math.round(loan.term) - loan.term) > eps) {
    loan.term = Math.round(loan.term);
}

// use when rounding needs to be done due to loss of precision inherent with floats
function customRound(val, type) {
    switch (type) {
        case roundType.DECIMALS:
            let decimals = parseInt(roundType.DECIMALS)
            val = Math.round(val * 10 ** decimals) / decimals;
            console.log(val)
            break;
        case roundType.PRECISION:
            if ((Math.abs(Math.round(val) - val) < eps)) {
                console.log(val)
                val = Math.round(val);
            }

            return val;
        default:
            break;
    }
}


function calculateLoanPrincipal(loan) {
    let monthlyInterestRate = loan.interestRate / 12;
    let monthlyInterestFactor = 1 + monthlyInterestRate;
    let result = loan.installment / monthlyInterestRate * (1 - monthlyInterestFactor ** (-loan.term));
    return customRound(result, roundType.DECIMALS);
}

function calculateLoanTerm(loan) {
    let monthlyInterestRate = loan.interestRate / 12;
    let monthlyInterestFactor = 1 + monthlyInterestRate;
    let result = (Math.log(loan.installment) - Math.log(loan.installment - loan.principal * monthlyInterestRate)) / Math.log(monthlyInterestFactor);
    return customRound(result, roundType.PRECISION);
}

function calculateInstallment(loan) {
    let monthlyInterestRate = loan.interestRate / 12;
    let monthlyInterestFactor = 1 + monthlyInterestRate;
    let result = (loan.principal * monthlyInterestRate) / (1 - (monthlyInterestFactor) ** (-loan.term))
    return customRound(result, roundType.DECIMALS);
}

function calculateInterestRate(loan) {
    let cashflow = [-loan.principal];
    for (let i = 0; i < loan.term; ++i) {
        cashflow.push(loan.installment);
    }

    let monthlyInterestRate = irr(cashflow);
    let result = monthlyInterestRate * 12;
    return customRound(result, roundType.DECIMALS);
}

console.log(`\n===INTEREST RATE CHECK===`);
let pmt = loan.installment;
let i = loan.interestRate / 12;
let q = 1 + i;
let n = loan.term;
let p = loan.principal

let balance = p * q ** n - pmt / i * (q ** n - 1)
console.log(`\n===BALANCE==`);
console.log(customRound(balance,roundType.DECIMALS));

//all below is for GPR calculation
function calculateAnnualCostsPercentageRate(loan, taxes){
    let initialTax = 0;
    let monthlyTax = 0;
    let cashflow = [];
    cashflow.push(-loan.principal + initialTax);

    for (let i = 0; i < loan.term; ++i) {
        cashflow.push(loan.installment + monthlyTax)
    }
}

function IRR(values, guess) {
    // Copyright (c) 2012 Sutoiku, Inc. (MIT License)

// Some algorithms have been ported from Apache OpenOffice:

    /**************************************************************
     *
     * Licensed to the Apache Software Foundation (ASF) under one
     * or more contributor license agreements.  See the NOTICE file
     * distributed with this work for additional information
     * regarding copyright ownership.  The ASF licenses this file
     * to you under the Apache License, Version 2.0 (the
     * "License"); you may not use this file except in compliance
     * with the License.  You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing,
     * software distributed under the License is distributed on an
     * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
     * KIND, either express or implied.  See the License for the
     * specific language governing permissions and limitations
     * under the License.
     *
     *************************************************************/

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