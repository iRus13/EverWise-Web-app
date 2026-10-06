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
  expect(screen.getByRole("button", {name:"Safari Correct choice · Not selected"})).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", {name:"Firefox Correct choice · Not selected"})).toBeDisabled();
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
  for (const name of ['Safari','Firefox']) {
    expect(screen.getByRole('button', {name: name + (selections.includes(name) ? ' Your choice · Correct' : ' Correct choice · Not selected')})).toBeDisabled();
  }
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

test('review keeps checkboxes tied to choices, labels missed answers, and narrates the visible review', () => {
  render(<MultiselectBlock {...props} block={{prompt:'Choose browsers',options:[{text:'Safari',correct:true},{text:'Calculator',correct:false},{text:'Firefox',correct:true}]}} />);
  const safari=screen.getByRole('button',{name:'Safari',exact:true});
  fireEvent.click(safari);
  fireEvent.click(safari);
  expect(screen.getByRole('button',{name:'Check',exact:true})).toBeDisabled();
  fireEvent.click(safari);
  fireEvent.click(screen.getByRole('button',{name:'Calculator',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Check',exact:true}));
  const selected=screen.getByRole('button',{name:'Safari Your choice · Correct'});
  const missed=screen.getByRole('button',{name:'Firefox Correct choice · Not selected'});
  expect(selected).toHaveAttribute('aria-pressed','true');
  expect(missed).toHaveAttribute('aria-pressed','false');
  expect(missed.querySelector('.lesson-multiple-mark svg')).toBeNull();
  expect(selected.querySelector('.lesson-multiple-mark svg')).not.toBeNull();
  expect(screen.getByRole('button',{name:'Calculator Your choice · Not correct'})).toBeDisabled();
  expect(screen.getByRole('status').compareDocumentPosition(selected) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  for(const text of ['Your choice · Correct','Your choice · Not correct','Correct choice · Not selected','Some choices need another look']) {
    expect(screen.getByTestId('narration')).toHaveTextContent(text);
  }
});

test('missing a correct choice does not show a correction meant for a wrong answer', () => {
  render(<MultiselectBlock {...props} block={{prompt:'Choose browsers',feedback:'Great job!',incorrectFeedback:'Calculator is not a browser.',options:[{text:'Safari',correct:true},{text:'Calculator',correct:false},{text:'Firefox',correct:true}]}} />);
  fireEvent.click(screen.getByRole('button',{name:'Safari',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Check',exact:true}));
  expect(screen.getByRole('status')).toHaveTextContent('You found some correct choices. Review the others below.');
  expect(screen.getByRole('status')).not.toHaveTextContent('Calculator is not a browser.');
  expect(screen.getByRole('status')).not.toHaveTextContent('Great job!');
});

test("choice examples keep the decision heading, readable story and narration in the same order", async () => {
  const {default:ChoiceBlock}=await import("../src/components/blocks/ChoiceBlock.jsx");
  const {lessonsByOrder}=await import("../src/data/lessons.js");
  const block=lessonsByOrder.find(item=>item.id==='deepfakes').blocks[16];
  render(<ChoiceBlock {...props} block={block}/>);
  const story=screen.getByText(block.text,{exact:true,selector:'p'});
  expect(story).toHaveClass('lesson-scenario-story');
  const heading=screen.getByRole('heading',{level:1});
  expect(heading).toHaveTextContent('What Can You Conclude?');
  expect(story.compareDocumentPosition(heading)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByTestId('narration').textContent).toBe(block.text+'\n\n'+block.title);
  fireEvent.click(screen.getByRole('button',{name:block.options[1],exact:true}));
  expect(screen.getByRole('status')).toHaveTextContent("That's right");
});

test("direct choice questions remain headings and unknown content keeps its complete prompt", async () => {
  const {default:ChoiceBlock}=await import("../src/components/blocks/ChoiceBlock.jsx");
  const {lessonsByOrder}=await import("../src/data/lessons.js");
  const direct=lessonsByOrder.flatMap(item=>item.blocks).find(block=>block.text==='Which activity does NOT use the internet?');
  const view=render(<ChoiceBlock {...props} block={direct}/>);
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent(direct.text);
  view.unmount();
  render(<ChoiceBlock {...props} block={{title:'Choose carefully',text:'A future prompt that has not been classified.',options:['Yes','No'],correctIndex:0}}/>);
  expect(screen.getByRole('heading',{level:1})).toHaveTextContent('A future prompt that has not been classified.');
});

test("every published choice block has a deliberate reading role and a decision title when needed", async () => {
  const {default:roles}=await import("../src/data/choice-text-roles.json");
  const {lessonsByOrder}=await import("../src/data/lessons.js");
  const blocks=lessonsByOrder.flatMap(item=>item.blocks).filter(block=>block.type==='choice');
  expect(blocks).toHaveLength(175);
  expect(blocks.filter(block=>roles[block.text]==='supporting')).toHaveLength(173);
  for(const block of blocks){expect(['supporting','question']).toContain(roles[block.text]);if(roles[block.text]==='supporting')expect(block.title?.trim()).toBeTruthy();}
});
