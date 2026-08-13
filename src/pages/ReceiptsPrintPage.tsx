import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as feeApi from '@/lib/feeApi';
import { toast } from 'sonner';

// Basic numbers-to-words converter
const numberToWords = (num: number): string => {
    const a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    const convert = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        return n.toString(); // Fallback for very large numbers
    };

    return convert(num) + ' only';
};

const getMonthsSummary = (allocations: any[]) => {
    if (!allocations || allocations.length === 0) return '';
    const sorted = [...allocations].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });
    
    // Group months by year
    const groups: { [key: number]: { month: number; name: string }[] } = {};
    sorted.forEach(a => {
        if (!groups[a.year]) {
            groups[a.year] = [];
        }
        groups[a.year].push({ month: a.month, name: a.month_name.substring(0, 3) });
    });

    const parts = Object.keys(groups).map(yearStr => {
        const year = parseInt(yearStr);
        const monthItems = groups[year];
        
        // Check if consecutive
        let isConsecutive = true;
        for (let i = 1; i < monthItems.length; i++) {
            if (monthItems[i].month !== monthItems[i-1].month + 1) {
                isConsecutive = false;
                break;
            }
        }

        // Range representation if >= 4 months
        if (isConsecutive && monthItems.length >= 4) {
            const first = monthItems[0].name;
            const last = monthItems[monthItems.length - 1].name;
            return `${first} to ${last} – ${year}`;
        }

        const names = monthItems.map(m => m.name);
        return `${names.join(', ')} – ${year}`;
    });

    return parts.join('; ');
};

const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

export const ReceiptsPrintPage: React.FC = () => {
    const { batchId } = useParams<{ batchId: string }>();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (batchId) {
            loadBatch();
        }
    }, [batchId]);

    const loadBatch = async () => {
        setLoading(true);
        try {
            const res = await feeApi.getReceiptBatch(parseInt(batchId!));
            setPayments(res.payments || []);
        } catch (error) {
            console.error('Failed to load batch', error);
            toast.error('Failed to load receipt details');
        } finally {
            setLoading(false);
        }
    };

    // SVGs matching preview.html design
    const cornerSVG = () => (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
            <path d="M4 34 L4 4 L34 4" strokeWidth="2.8" />
            <path d="M4 46 C4 22 22 4 46 4" strokeWidth="1.6" />
            <path d="M4 40 C4 24 12 16 26 16 C 40 16 43 33 30 39 C 22 42 17 34 23 29" />
            <path d="M40 4 C24 4 16 12 16 26 C 16 40 33 43 39 30 C 42 22 34 17 29 23" />
            <path d="M46 4 C 56 4 58 12 52 16" strokeWidth="1.4" />
            <path d="M4 46 C4 56 12 58 16 52" strokeWidth="1.4" />
            <circle cx="4" cy="4" r="3.4" fill="currentColor" stroke="none" />
            <circle cx="26" cy="26" r="1.7" fill="currentColor" stroke="none" />
        </svg>
    );

    const edgeSVG = (id: string) => (
        <svg preserveAspectRatio="none" viewBox="0 0 240 12" className="w-full h-full block">
            <defs>
                <pattern id={id} width="24" height="12" patternUnits="userSpaceOnUse">
                    <path d="M0 6 C4 1 8 1 12 6 C16 11 20 11 24 6" fill="none" stroke="currentColor" strokeWidth="1.1" />
                    <path d="M0 6 C4 11 8 11 12 6 C16 1 20 1 24 6" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
                    <circle cx="12" cy="6" r="1.05" fill="currentColor" />
                    <circle cx="0" cy="6" r="0.7" fill="currentColor" />
                </pattern>
            </defs>
            <rect width="240" height="12" fill={`url(#${id})`} />
        </svg>
    );

    // Labels matching preview.html
    const L = {
        title1: "കണ്ണാടിപ്പറമ്പ്",
        title2: "ദാറുൽ ഹസനാത്ത് ഇസ്‌ലാമിക് കോളേജ്",
        runBy: "Run by : ദാറുൽ ഹസനാത്ത് ഇസ്‌ലാമിക് കോംപ്ലക്സ്",
        address: "നിടുവാട്ട്, പി. ഒ. നാറാത്ത്, കണ്ണൂർ – 670601. ഫോൺ : 0497 2797032, 2796938",
        number: "നമ്പർ", date: "തീയതി", donor: "ജ:",
        purpose: "അവർകളിൽ നിന്നു സംഭാവനയായി",
        amount: "നന്ദിപൂർവ്വം സ്വീകരിച്ചിരിക്കുന്നു.",
        secretary: "സെക്രട്ടറി",
        footer: "ഈ സംഭാവന നൽകിയതിന് അല്ലാഹു ഇഹത്തിലും പരത്തിലും തക്കതായ പ്രതിഫലം നൽകട്ടെ (ആമീൻ)"
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 text-slate-600 font-medium">
                Loading print batch...
            </div>
        );
    }

    // Chunk payments into groups of 6 for A4 printing layout
    const pages: any[][] = [];
    for (let i = 0; i < payments.length; i += 6) {
        pages.push(payments.slice(i, i + 6));
    }
    if (pages.length === 0) pages.push([]);

    return (
        <div className="print-body min-h-screen bg-slate-200 py-4 font-sans text-slate-800">
            {/* Styles inject to support fonts, layout, scaling, print target */}
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700;800&family=Caveat:wght@500;600;700&family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{ __html: `
                :root {
                    --paper: #F7F7F2;
                    --ink-print: #29286F;
                    --brd: #25266F;
                    --ink-hand: #353080;
                    --red: #B53B3B;
                }
                .print-body {
                    background: #E9E9EC;
                    font-family: 'Noto Sans Malayalam', 'Nirmala UI', sans-serif;
                    color: var(--ink-print);
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .a4-page {
                    width: 210mm;
                    height: 297mm;
                    background: #fff;
                    margin: 0 auto 8mm auto;
                    box-shadow: 0 2px 14px rgba(0,0,0,.18);
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .grid2 {
                    display: grid;
                    grid-template-columns: repeat(2, auto);
                    grid-template-rows: repeat(3, auto);
                    gap: 4mm;
                }
                .cell {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .empty-box {
                    width: 100mm;
                    height: 74mm;
                }
                .receipt-card {
                    position: relative;
                    width: 100mm;
                    height: 74mm;
                    font-size: 2.42mm;
                    overflow: hidden;
                    box-sizing: border-box;
                }
                .receipt-card .paper {
                    position: absolute;
                    inset: 0;
                    border-radius: .4em;
                    overflow: hidden;
                    background-color: var(--paper);
                    background-image:
                        radial-gradient(120% 90% at 30% 12%, rgba(255,255,255,.5), rgba(0,0,0,0) 60%),
                        radial-gradient(120% 90% at 85% 95%, rgba(41,40,111,.03), rgba(0,0,0,0) 55%);
                }
                .receipt-card .frame-outer { position: absolute; inset: 1.6%; border: 1px solid var(--brd); border-radius: .3em; }
                .receipt-card .frame-inner { position: absolute; inset: 3.1%; border: 1px solid var(--brd); border-radius: .2em; }
                
                .receipt-card .corner { position: absolute; height: 9%; color: var(--brd); line-height: 0; }
                .receipt-card .corner-tl { top: 2.4%; left: 2.4%; }
                .receipt-card .corner-tr { top: 2.4%; right: 2.4%; transform: scaleX(-1); }
                .receipt-card .corner-bl { bottom: 2.4%; left: 2.4%; transform: scaleY(-1); }
                .receipt-card .corner-br { bottom: 2.4%; right: 2.4%; transform: scale(-1,-1); }

                .receipt-card .edge { position: absolute; left: 6%; width: 88%; height: 3.2%; color: var(--brd); line-height: 0; }
                .receipt-card .edge-top { top: 2.2%; }
                .receipt-card .edge-bot { bottom: 2.2%; transform: scaleY(-1); }

                .receipt-card .content { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 5% 7.5% 6.5%; }
                .receipt-card .mal { color: var(--ink-print); }
                .receipt-card .hand { font-family: 'Noto Sans Malayalam', 'Nirmala UI', sans-serif; color: var(--ink-print); letter-spacing: normal; }
                .receipt-card .sig { font-family: 'Noto Sans Malayalam', 'Nirmala UI', sans-serif; color: var(--ink-print); }
                .receipt-card .tilt { transform: none; }
                .receipt-card .tilt2 { transform: none; }

                .receipt-card .header { text-align: center; line-height: 1; }
                .receipt-card .h1 { font-size: 1.5em; font-weight: 700; }
                .receipt-card .h2 { font-size: 1.9em; font-weight: 800; line-height: 1.02; margin-top: .12em; }
                .receipt-card .hsmall { font-size: .82em; font-weight: 500; margin-top: .3em; }
                .receipt-card .haddr { font-size: .8em; font-weight: 500; margin-top: .1em; }

                .receipt-card .numrow { display: flex; align-items: flex-end; justify-content: space-between; gap: 1em; margin-top: .6em; }
                .receipt-card .numL { display: flex; align-items: flex-end; gap: .45em; }
                .receipt-card .numR { display: flex; align-items: flex-end; gap: .4em; }
                .receipt-card .label { font-size: .9em; font-weight: 600; line-height: 1; white-space: nowrap; flex: 0 0 auto; }
                .receipt-card .rednum { color: var(--red); font-size: 1.8em; font-weight: 700; line-height: .8; }
                .receipt-card .dateval { font-size: 1.25em; font-weight: 600; line-height: 1; position: relative; bottom: .05em; }

                .receipt-card .row { display: flex; align-items: flex-end; gap: .35em; margin-top: .4em; }
                .receipt-card .line { position: relative; flex: 1 1 auto; min-width: 0; min-height: 1.5em; border-bottom: 1px dotted var(--brd); }
                .receipt-card .val { position: absolute; bottom: -0.15em; left: .4em; white-space: nowrap; line-height: 1; overflow: hidden; text-overflow: ellipsis; max-width: 95%; }
                .receipt-card .vname { font-size: 1.35em; font-weight: 600; }
                .receipt-card .vpurpose { font-size: 1.1em; font-weight: 600; }
                .receipt-card .vdesc { font-size: 1.1em; font-weight: 600; }

                .receipt-card .spacer { flex: 1 1 auto; }

                .receipt-card .amtwrap { display: flex; align-items: flex-end; justify-content: space-between; gap: .8em; margin-top: .5em; }
                .receipt-card .amtL .label { display: block; margin-bottom: .3em; }
                .receipt-card .amtbox { display: inline-flex; align-items: stretch; border: 1.6px solid var(--brd); border-radius: .35em; overflow: hidden; height: 3.2em; }
                .receipt-card .rs { display: flex; align-items: center; justify-content: center; padding: 0 .7em; background: var(--brd); color: #fff; font-size: 1.35em; font-weight: 800; line-height: 1; }
                .receipt-card .amt { display: flex; align-items: center; min-width: 4.5em; padding: 0 .7em; background: rgba(255,255,255,.65); font-size: 1.6em; font-weight: 800; line-height: 1; }

                .receipt-card .sigwrap { display: flex; flex-direction: column; align-items: center; }
                .receipt-card .sigtext { font-size: 1.7em; line-height: .8; margin-bottom: .05em; }

                .receipt-card .notice { margin-top: .5em; border: 1px solid var(--brd); border-radius: .4em; padding: .3em .5em; text-align: center; background: rgba(255,255,255,.5); }
                .receipt-card .notice span { font-size: .85em; font-weight: 600; line-height: 1.25; color: var(--ink-print); }

                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body, .print-body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
                    .no-print { display: none !important; }
                    .a4-page { margin: 0; box-shadow: none; page-break-after: always; break-after: page; }
                    .a4-page:last-of-type { page-break-after: auto; break-after: auto; }
                    .receipt-card { break-inside: avoid; page-break-inside: avoid; }
                }
            ` }} />

            {/* Print control toolbar */}
            <div className="no-print flex justify-center gap-3 p-4 mb-4">
                <button
                    onClick={() => window.print()}
                    className="bg-[#29286F] hover:bg-[#1a1a54] text-white font-semibold text-sm px-6 py-2 rounded-lg shadow-md transition-colors"
                >
                    Print / Save PDF
                </button>
                <button
                    onClick={() => window.close()}
                    className="bg-slate-600 hover:bg-slate-700 text-white font-semibold text-sm px-6 py-2 rounded-lg shadow-md transition-colors"
                >
                    Close Preview
                </button>
            </div>

            {/* A4 Pages Container */}
            <div className="pages-container">
                {pages.map((pagePayments, pageIdx) => (
                    <div key={pageIdx} className="a4-page">
                        <div className="grid2">
                            {Array.from({ length: 6 }).map((_, cellIdx) => {
                                const p = pagePayments[cellIdx];
                                const uniqueIdx = pageIdx * 6 + cellIdx;

                                if (!p) {
                                    return (
                                        <div key={cellIdx} className="cell">
                                            <div className="empty-box" />
                                        </div>
                                    );
                                }

                                const displayNum = p.id.toString();
                                const displayDate = p.payment_date 
                                    ? new Date(p.payment_date).toLocaleDateString('en-IN') 
                                    : '-';

                                return (
                                    <div key={cellIdx} className="cell">
                                        <div className="receipt-card">
                                            <div className="paper">
                                                <div className="frame-outer" />
                                                <div className="frame-inner" />
                                                <span className="edge edge-top">{edgeSVG(`pt-${uniqueIdx}`)}</span>
                                                <span className="edge edge-bot">{edgeSVG(`pb-${uniqueIdx}`)}</span>
                                                <span className="corner corner-tl">{cornerSVG()}</span>
                                                <span className="corner corner-tr">{cornerSVG()}</span>
                                                <span className="corner corner-bl">{cornerSVG()}</span>
                                                <span className="corner corner-br">{cornerSVG()}</span>
                                            </div>
                                            <div className="content">
                                                <div className="header">
                                                    <div className="h1 mal">{L.title1}</div>
                                                    <div className="h2 mal">{L.title2}</div>
                                                    <div className="hsmall mal">{L.runBy}</div>
                                                    <div className="haddr mal">{L.address}</div>
                                                </div>
                                                <div className="numrow">
                                                    <div className="numL">
                                                        <span className="label mal">{L.number}</span>
                                                        <span className="rednum hand tilt2">{displayNum}</span>
                                                    </div>
                                                    <div className="numR">
                                                        <span className="label mal">{L.date}</span>
                                                        <span className="dateval hand tilt2">{displayDate}</span>
                                                    </div>
                                                </div>

                                                {/* Donor Name Row */}
                                                <div className="row">
                                                    <span className="label mal">{L.donor}</span>
                                                    <span className="line">
                                                        <span className="val hand tilt vname">{toTitleCase(p.student_name)}</span>
                                                    </span>
                                                </div>

                                                {/* Amount in words Row */}
                                                <div className="row">
                                                    <span className="label mal">{L.purpose}</span>
                                                    <span className="line">
                                                        <span className="val hand tilt2 vpurpose">{numberToWords(p.paid_amount)}</span>
                                                    </span>
                                                </div>

                                                {/* Extra empty writing/spacing line */}
                                                <div className="row">
                                                    <span className="line"></span>
                                                </div>

                                                {/* Allocation Months Description Row */}
                                                <div className="row">
                                                    <span className="line">
                                                        <span className="val hand tilt vdesc">
                                                            {getMonthsSummary(p.allocations)}
                                                        </span>
                                                    </span>
                                                </div>

                                                <div className="spacer" />

                                                <div className="amtwrap">
                                                    <div className="amtL">
                                                        <span className="label mal">{L.amount}</span>
                                                        <div className="amtbox">
                                                            <span className="rs">₹</span>
                                                            <span className="amt hand tilt2">{p.paid_amount}/-</span>
                                                        </div>
                                                    </div>
                                                    <div className="sigwrap">
                                                        <span className="sig tilt sigtext"></span>
                                                        <span className="label mal">{L.secretary}</span>
                                                    </div>
                                                </div>
                                                <div className="notice">
                                                    <span className="mal">{L.footer}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
