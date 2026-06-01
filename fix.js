const fs = require('fs');
const content = fs.readFileSync('d:\\TechHat website\\rahima-jannat-web\\src\\components\\dashboard\\accounts\\FeeCollection_fixed.tsx', 'utf-8').replace(/\r\n/g, '\n');

// 1. Fix the duplicate block
const startMarker1 = `                                                      ) : (\n                                                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">পরিশোধিত</Badge>\n                                                      )}\n                                                  </TableCell>`;
const endMarker1 = `                                                  <TableCell className="text-right flex justify-end gap-2">`;

let newContent = content;
let idx1 = newContent.indexOf(startMarker1);
if (idx1 !== -1) {
    let idx1_end = newContent.indexOf(endMarker1, idx1 + startMarker1.length);
    if (idx1_end !== -1) {
        newContent = newContent.substring(0, idx1 + startMarker1.length) + '\n' + newContent.substring(idx1_end);
        console.log("Fix 1 applied");
    } else {
        console.log("Fix 1 end marker not found");
    }
} else {
    console.log("Fix 1 start marker not found");
}

// 2. Fix the corrupted tabs / history
const startMarker2 = `                                                      <Button disabled={selectedDues.length===0 || collecting} onClick={handleCollect} className="w-full bg-green-700`;
const endMarker2 = `                                                    paidHistory.map(h => (`;
let idx2 = newContent.indexOf(startMarker2);
if (idx2 !== -1) {
    let idx2_end = newContent.indexOf(endMarker2, idx2);
    if (idx2_end !== -1) {
        let replacement = `                                                      <Button disabled={selectedDues.length===0 || collecting} onClick={handleCollect} className="w-full bg-green-700 hover:bg-green-800 text-white shadow-md">\n                                                          {collecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin inline"/> প্রসেসিং...</> : "ফি কালেক্ট করুন"}\n                                                      </Button>\n                                                  </CardContent>\n                                              </Card>\n                                          </div>\n                                      </div>\n                                    </TabsContent>\n                                    \n                                    <TabsContent value="history">\n                                        <div className="hidden md:block border rounded-lg overflow-hidden mt-4">\n                                            <Table>\n                                                <TableHeader className="bg-gray-50">\n                                                    <TableRow>\n                                                        <TableHead>তারিখ</TableHead>\n                                                        <TableHead>বিবরণ</TableHead>\n                                                        <TableHead className="text-right">পরিমাণ</TableHead>\n                                                        <TableHead className="text-right">অ্যাকশন</TableHead>\n                                                    </TableRow>\n                                                </TableHeader>\n                                                <TableBody>\n                                                    {paidHistory.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">কোনো পেমেন্ট হিস্টোরি নেই</TableCell></TableRow> : \n`;
        newContent = newContent.substring(0, idx2) + replacement + newContent.substring(idx2_end);
        console.log("Fix 2 applied");
    } else {
        console.log("Fix 2 end marker not found");
    }
} else {
    console.log("Fix 2 start marker not found");
}

// 3. Fix the garbage map fragment
const strToReplace = `                                 </Tabs>?ি নেই</TableCell></TableRow> : \n                                                     paidHistory.map(h => (\n                                                         <TableRow key={h.id}>\n                                                             <TableCell className="text-sm">{format(new Date(h.payment_date || h.updated_at || h.created_at), 'dd MMM yyyy')}</TableCell>\n                                                             <TableCell className="font-medium">\n                                                                 {h.title}\n                                                                 <div className="text-[10px] text-gray-400">{h.fee_types?.name_bn || 'সাধারণ'}</div>\n                                                                 {h.status === 'waived' && <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-[9px] mt-1">মওকুফ</Badge>}\n                                                             </TableCell>\n                                                             <TableCell className="text-right font-bold text-green-600">৳ {toBengaliNumber(h.paid_amount || h.net_amount || h.amount || 0)}</TableCell>\n                                                             <TableCell className="text-right">\n                                                                 <Button size="sm" variant="outline" onClick={() => handleHistoryReceipt(h)}><Download className="w-4 h-4 mr-1"/> রশিদ</Button>\n                                                             </TableCell>\n                                                         </TableRow>\n                                     </TabsContent>\n                                 </Tabs>`;
if (newContent.includes(strToReplace)) {
    newContent = newContent.replace(strToReplace, `                                 </Tabs>`);
    console.log("Fix 3 applied");
} else {
    console.log("Fix 3 strToReplace not found");
}

fs.writeFileSync('d:\\TechHat website\\rahima-jannat-web\\src\\components\\dashboard\\accounts\\FeeCollection.tsx', newContent, 'utf-8');
console.log("Done");