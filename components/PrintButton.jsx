'use client';
import Icon from './Icon';
export default function PrintButton() { return <button className="btn" onClick={() => window.print()}><Icon name="printer" size={17} />Print / save PDF</button>; }
