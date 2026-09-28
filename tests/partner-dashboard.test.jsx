import React from "react";
import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,expect,test,vi} from "vitest";
const mocks=vi.hoisted(()=>({fetch:vi.fn(),rotate:vi.fn(),native:false}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>mocks.native},registerPlugin:()=>({getInsets:async()=>({top:0})})}));
vi.mock('../src/services/partnerAccess.js',()=>({fetchPartnerReport:mocks.fetch,rotatePartnerInvite:mocks.rotate}));
import PartnerDashboard from '../src/screens/PartnerDashboard';
globalThis.React=React;
const report=name=>({name,branding:{name},seats:{claimed:6,available:494,limit:500},research:{consentedCount:4,consentedPercentage:66.7,suppressed:true,distributions:null},invitation:{status:'active'},updatedAt:'2026-08-02T12:00:00.000Z'});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
beforeEach(()=>{mocks.native=false;mocks.fetch.mockReset();mocks.rotate.mockReset();Element.prototype.scrollIntoView=vi.fn();});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllEnvs();});
async function startRotation(){fireEvent.click(await screen.findByRole('button',{name:'Replace learner link'}));fireEvent.click(screen.getByRole('button',{name:'Replace link now'}));}

test('changing admin links clears a revealed invitation before loading another report',async()=>{
 mocks.fetch.mockResolvedValueOnce(report('First partner')).mockResolvedValueOnce(report('Second partner'));
 mocks.rotate.mockResolvedValue({inviteToken:'a'.repeat(43)});
 const {rerender}=render(<PartnerDashboard adminToken="first"/>);await startRotation();
 await screen.findByLabelText('Replacement learner link');
 rerender(<PartnerDashboard adminToken="second"/>);
 await screen.findByText('Reporting for Second partner');
 expect(screen.queryByLabelText('Replacement learner link')).toBeNull();
 expect(screen.getByRole('button',{name:'Replace learner link'})).toBeVisible();
});

test('a late rotation response cannot reveal the previous partner link in a new session',async()=>{
 const pending=deferred();mocks.rotate.mockReturnValue(pending.promise);
 mocks.fetch.mockResolvedValueOnce(report('First partner')).mockResolvedValueOnce(report('Second partner'));
 const {rerender}=render(<PartnerDashboard adminToken="first"/>);await startRotation();
 rerender(<PartnerDashboard adminToken="second"/>);await screen.findByText('Reporting for Second partner');
 await act(async()=>pending.resolve({inviteToken:'a'.repeat(43)}));
 expect(screen.queryByLabelText('Replacement learner link')).toBeNull();
});

test('removing an admin link cannot keep a loaded report visible',async()=>{
 mocks.fetch.mockResolvedValue(report('First partner'));const {rerender}=render(<PartnerDashboard adminToken="first"/>);
 await screen.findByText('Reporting for First partner');rerender(<PartnerDashboard adminToken={null}/>);
 expect(screen.queryByText('Reporting for First partner')).toBeNull();
 expect(screen.getByText('This admin link is not available.')).toBeVisible();
});

test('replacement keeps the report timestamp honest and focuses the new link',async()=>{
 mocks.fetch.mockResolvedValue(report('Partner'));mocks.rotate.mockResolvedValue({inviteToken:'a'.repeat(43)});
 render(<PartnerDashboard adminToken="first"/>);await startRotation();
 const link=await screen.findByLabelText('Replacement learner link');
 expect(screen.getByRole('time')).toHaveAttribute('datetime','2026-08-02T12:00:00.000Z');
 await waitFor(()=>expect(link).toHaveFocus());
});

test('confirmation receives focus and cancellation returns focus without replacing anything',async()=>{
 mocks.fetch.mockResolvedValue(report('Partner'));render(<PartnerDashboard adminToken="first"/>);
 fireEvent.click(await screen.findByRole('button',{name:'Replace learner link'}));
 expect(screen.getByRole('heading',{name:'Replace learner link?'})).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
 expect(screen.getByRole('button',{name:'Replace learner link'})).toHaveFocus();
 expect(mocks.rotate).not.toHaveBeenCalled();
});

test('pending replacement cannot be submitted twice',async()=>{
 mocks.fetch.mockResolvedValue(report('Partner'));mocks.rotate.mockReturnValue(new Promise(()=>{}));
 render(<PartnerDashboard adminToken="first"/>);await startRotation();
 fireEvent.click(screen.getByRole('button',{name:'Replacing…'}));
 expect(screen.getByRole('button',{name:'Cancel'})).toBeDisabled();
 expect(mocks.rotate).toHaveBeenCalledOnce();
});


test('native invitation uses the public web origin instead of the app page',async()=>{
 mocks.native=true;vi.stubEnv('VITE_EVERWISE_PUBLIC_APP_ORIGIN','https://learning.example.com');
 mocks.fetch.mockResolvedValue(report('Partner'));mocks.rotate.mockResolvedValue({inviteToken:'a'.repeat(43)});
 render(<PartnerDashboard adminToken="first"/>);await startRotation();
 expect(await screen.findByLabelText('Replacement learner link')).toHaveValue('https://learning.example.com/#partner='+'a'.repeat(43));
});

test('unsafe native origin prevents replacement before any provider mutation',async()=>{
 mocks.native=true;vi.stubEnv('VITE_EVERWISE_PUBLIC_APP_ORIGIN','http://unsafe.example.com');
 mocks.fetch.mockResolvedValue(report('Partner'));render(<PartnerDashboard adminToken="first"/>);
 expect(await screen.findByText('Open this report in a web browser to replace the learner link.')).toBeVisible();
 expect(screen.queryByRole('button',{name:'Replace learner link'})).toBeNull();
 expect(mocks.rotate).not.toHaveBeenCalled();
});
