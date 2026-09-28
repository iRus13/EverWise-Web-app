import React from "react";
import {afterEach, expect, test, vi} from "vitest";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import ScenarioBlock from "../src/components/blocks/ScenarioBlock.jsx";
import TrueFalseBlock from "../src/components/blocks/TrueFalseBlock.jsx";
import MultiselectBlock from "../src/components/blocks/MultiselectBlock.jsx";
import ReadingBlock from "../src/components/blocks/ReadingBlock.jsx";
import BuilderBlock from "../src/components/blocks/BuilderBlock.jsx";
vi.mock("../src/components/ReadAloud", () => ({default: ({text}) => <div data-testid="narration">{text}</div>}));
if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
afterEach(cleanup);
const props={progress:1,progressTotal:4,onBack:vi.fn(),onExit:vi.fn(),onContinue:vi.fn()};

test("incorrect multiple choice names the correct answer independently of color and cannot be changed", () => {
  render(<ScenarioBlock {...props} block={{text:"How do you open a website?",options:["Use a browser","Use a calculator"],correctIndex:0,explanation:"A browser opens websites."}}/>);
  fireEvent.click(screen.getByRole("button",{name:"Use a calculator"}));
  expect(screen.getByRole("status")).toHaveTextContent("The correct answer is: Use a browser");
  expect(screen.getByRole("button",{name:"Use a calculator"})).toHaveAttribute("aria-pressed","true");
  expect(screen.getByRole("button",{name:"Use a browser"})).toBeDisabled();
});

test("moving to the next question removes feedback and moves focus to its heading", () => {
  render(<TrueFalseBlock {...props} block={{questions:[{text:"First question",answer:false},{text:"Second question",answer:true}]}}/>);
  fireEvent.click(screen.getByRole("button",{name:"True",exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent("The correct answer is: False");
  fireEvent.click(screen.getByRole("button",{name:"Next",exact:true}));
  expect(screen.getByRole("heading",{name:"Second question"})).toHaveFocus();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("button",{name:"True",exact:true})).not.toBeDisabled();
});

test("multiple selection identifies all correct choices even if authored feedback is absent", () => {
  render(<MultiselectBlock {...props} block={{prompt:"Choose web browsers",options:[{text:"Safari",correct:true},{text:"Calculator",correct:false},{text:"Firefox",correct:true}]}}/>);
  fireEvent.click(screen.getByRole("button",{name:"Calculator"}));
  fireEvent.click(screen.getByRole("button",{name:"Check",exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent("Correct choices: Safari; Firefox");
});

test("scam reading narration includes the heading and every visible warning sign", () => {
  const block={heading:"Recognize a scam",objective:"Spot the warning signs",question:"Does it feel rushed?",warningSigns:["Pressure to act","Requests for secrecy"],text:"Pause and check the message."};
  render(<ReadingBlock {...props} block={block}/>);
  for(const text of [block.heading,block.objective,block.question,...block.warningSigns,block.text]) expect(screen.getByTestId("narration")).toHaveTextContent(text);
});

test("builder announces selection state, requires every column, and keeps its result until continuing", () => {
  const onContinue=vi.fn();
  render(<BuilderBlock {...props} onContinue={onContinue} block={{title:"Build an example",columns:[{label:"Word",items:["River","Oak"]},{label:"Number",items:["42","87"]}],feedback:"Use your own words for a real password."}}/>);
  fireEvent.click(screen.getByRole("button",{name:"River",exact:true}));
  expect(screen.getByRole("button",{name:"River",exact:true})).toHaveAttribute("aria-pressed","true");
  expect(screen.getByRole("button",{name:"Continue",exact:true})).toBeDisabled();
  fireEvent.click(screen.getByRole("button",{name:"42",exact:true}));
  fireEvent.click(screen.getByRole("button",{name:"Continue",exact:true}));
  expect(screen.getByRole("status")).toHaveTextContent("Use your own words for a real password.");
  expect(screen.getByText("River42")).toBeVisible();
  expect(onContinue).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Continue",exact:true}));
  expect(onContinue).toHaveBeenCalledOnce();
});

test("flashcards expose the visible card content to assistive technology and reset when moving on", async () => {
  const {default:FlashcardsBlock}=await import("../src/components/blocks/FlashcardsBlock.jsx");
  render(<FlashcardsBlock {...props} block={{cards:[{front:"Browser",back:"An app that opens websites"},{front:"Link",back:"An address you can follow"}]}}/>);
  expect(screen.getByRole("button",{name:"Show back of card"})).toHaveAccessibleDescription("Browser");
  fireEvent.click(screen.getByRole("button",{name:"Show back of card"}));
  expect(screen.getByRole("button",{name:"Show front of card"})).toHaveAccessibleDescription("An app that opens websites");
  fireEvent.click(screen.getByRole("button",{name:"Next card"}));
  expect(screen.getByRole("button",{name:"Show back of card"})).toHaveAccessibleDescription("Link");
  expect(screen.getByRole("heading",{name:"Flashcards"})).toHaveFocus();
});


test.each([[['Calculator']], [['Safari']], [['Safari', 'Firefox', 'Calculator']]])('incomplete or incorrect multiple selection does not reuse success praise: %j', (selections) => {
  render(<MultiselectBlock {...props} block={{prompt:'Choose browsers',feedback:'Great job! These are all web browsers.',options:[{text:'Safari',correct:true},{text:'Calculator',correct:false},{text:'Firefox',correct:true}]}} />);
  for (const label of selections) fireEvent.click(screen.getByRole('button',{name:label,exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Check',exact:true}));
  expect(screen.getByRole('status')).toHaveTextContent("Let's review your choices");
  expect(screen.getByRole('status')).toHaveTextContent('Correct choices: Safari; Firefox');
  expect(screen.getByRole('status')).not.toHaveTextContent('Great job!');
});

test('a fully correct multiple selection retains its authored success explanation', () => {
  render(<MultiselectBlock {...props} block={{prompt:'Choose browsers',feedback:'Great job! Browsers open websites.',options:[{text:'Safari',correct:true},{text:'Calculator',correct:false},{text:'Firefox',correct:true}]}} />);
  for (const name of ['Safari','Firefox']) fireEvent.click(screen.getByRole('button',{name,exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Check',exact:true}));
  expect(screen.getByRole('status')).toHaveTextContent("That's right");
  expect(screen.getByRole('status')).toHaveTextContent('Great job! Browsers open websites.');
});

test('incorrect multiple selection retains specific authored correction', () => {
  render(<MultiselectBlock {...props} block={{prompt:'Choose browsers',feedback:'Great job!',incorrectFeedback:'A calculator works with numbers. A browser opens websites.',options:[{text:'Safari',correct:true},{text:'Calculator',correct:false}]}} />);
  fireEvent.click(screen.getByRole('button',{name:'Calculator',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Check',exact:true}));
  expect(screen.getByRole('status')).toHaveTextContent('A calculator works with numbers. A browser opens websites.');
  expect(screen.getByRole('status')).not.toHaveTextContent('Great job!');
});
