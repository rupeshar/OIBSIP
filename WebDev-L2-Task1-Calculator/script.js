function initCalculator() {
  const screen = document.querySelector('#calcScreen');
  const buttons = document.querySelectorAll('.key');
  const historyList = document.querySelector('#historyList');
  const clearHistoryButton = document.querySelector('#clearHistory');

  if (!screen || !historyList || buttons.length === 0) return;

  let displayValue = '0';
  let firstValue = null;
  let operator = null;
  let waitingForNumber = false;

  function updateDisplay() {
    screen.value = displayValue;
  }

  function showInHistory(left, operation, right, result) {
    const emptyMessage = historyList.querySelector('.empty-history');
    if (emptyMessage) emptyMessage.remove();

    const symbols = {
      '*': '×',
      '/': '÷'
    };
    const historyItem = document.createElement('li');
    const visibleOperator = symbols[operation] || operation;

    historyItem.textContent = `${left} ${visibleOperator} ${right} = ${result}`;
    historyList.prepend(historyItem);
  }

  function clearHistory() {
    historyList.innerHTML = '<li class="empty-history">No calculations yet</li>';
  }

  function clearCalculator() {
    displayValue = '0';
    firstValue = null;
    operator = null;
    waitingForNumber = false;
    updateDisplay();
  }

  function deleteLastCharacter() {
    if (displayValue === 'Cannot divide by zero') {
      displayValue = '0';
      updateDisplay();
      return;
    }

    if (waitingForNumber) return;

    if (displayValue.length > 1) {
      displayValue = displayValue.slice(0, -1);
    } else {
      displayValue = '0';
    }

    updateDisplay();
  }

  function calculatePercentage() {
    if (displayValue === 'Cannot divide by zero') return;

    const currentValue = Number(displayValue);

    if (Number.isNaN(currentValue)) return;

    displayValue = String(Number((currentValue / 100).toFixed(12)));
    waitingForNumber = false;
    updateDisplay();
  }

  function calculate(left, right, operation) {
    let result;

    switch (operation) {
      case '+':
        result = left + right;
        break;

      case '-':
        result = left - right;
        break;

      case '*':
        result = left * right;
        break;

      case '/':
        return right === 0
          ? 'Cannot divide by zero'
          : Number((left / right).toFixed(12));

      default:
        return right;
    }

    return Number(result.toFixed(12));
  }

  function enterNumber(value) {
    if (waitingForNumber || displayValue === '0') {
      displayValue = value === '.' ? '0.' : value;
      waitingForNumber = false;
    } else if (value !== '.' || !displayValue.includes('.')) {
      displayValue += value;
    }

    updateDisplay();
  }

  function chooseOperator(nextOperator) {
    const currentValue = Number(displayValue);

    if (operator && !waitingForNumber) {
      const result = calculate(firstValue, currentValue, operator);

      showInHistory(firstValue, operator, currentValue, result);
      displayValue = String(result);
      firstValue = result;
      updateDisplay();

      if (result === 'Cannot divide by zero') {
        operator = null;
        firstValue = null;
        waitingForNumber = true;
        return;
      }
    } else if (firstValue === null) {
      firstValue = currentValue;
    }

    operator = nextOperator;
    waitingForNumber = true;
  }

  function solve() {
    if (!operator || waitingForNumber) return;

    const secondValue = Number(displayValue);
    const result = calculate(firstValue, secondValue, operator);

    showInHistory(firstValue, operator, secondValue, result);
    displayValue = String(result);
    firstValue = null;
    operator = null;
    waitingForNumber = true;
    updateDisplay();
  }

  function handleInput(type, value) {
    if (type === 'clear') {
      clearCalculator();
      return;
    }

    if (type === 'delete') {
      deleteLastCharacter();
      return;
    }

    if (displayValue === 'Cannot divide by zero') return;

    if (type === 'num') {
      enterNumber(value);
      return;
    }

    if (type === 'percent') {
      calculatePercentage();
      return;
    }

    if (type === 'op') {
      chooseOperator(value);
      return;
    }

    if (type === 'equal') {
      solve();
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      handleInput(button.dataset.type, button.dataset.val);
    });
  });

  clearHistoryButton.addEventListener('click', clearHistory);

  document.addEventListener('keydown', (event) => {
    const { key } = event;

    if (/^\d$/.test(key) || key === '.') {
      handleInput('num', key);
      return;
    }

    if (['+', '-', '*', '/'].includes(key)) {
      handleInput('op', key);
      return;
    }

    if (key === '%') {
      event.preventDefault();
      handleInput('percent');
      return;
    }

    if (key === 'Enter' || key === '=') {
      event.preventDefault();
      handleInput('equal');
      return;
    }

    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      handleInput('delete');
      return;
    }

    if (key === 'Escape' || key === 'c' || key === 'C') {
      handleInput('clear');
    }
  });

  updateDisplay();
}

document.addEventListener('DOMContentLoaded', initCalculator);
