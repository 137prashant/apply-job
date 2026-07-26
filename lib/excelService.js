const XLSX = require('xlsx');

class ExcelService {
  static exportToExcel(applications, filename = 'job_applications.xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(applications.map(app => ({
      'Email': app.email,
      'Name': app.name || '',
      'Company': app.company || '',
      'HR Number': app.hrNumber || '',
      'Applied': app.isApplied ? 'Yes' : 'No',
      'Applied Date': app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '',
      'Created Date': new Date(app.createdAt).toLocaleDateString()
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Applications');
    
    return XLSX.writeFile(workbook, filename);
  }

  static importFromExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return data.map(row => ({
        email: row.Email || row.email || '',
        name: row.Name || row.name || '',
        company: row.Company || row.company || '',
        hrNumber: row['HR Number'] || row.hrNumber || '',
        isApplied: row.Applied === 'Yes' || row.applied === true || false,
        appliedDate: row['Applied Date'] || row.appliedDate || null
      })).filter(row => row.email); // Filter out rows without email
      
    } catch (error) {
      throw new Error(`Error reading Excel file: ${error.message}`);
    }
  }

  static generateTemplate() {
    const templateData = [
      {
        'Email': 'john.doe@company.com',
        'Name': 'John Doe',
        'Company': 'Company Inc',
        'HR Number': '+91 9876543210',
        'Applied': 'No',
        'Applied Date': '',
        'Created Date': new Date().toLocaleDateString()
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Applications');
    
    return XLSX.writeFile(workbook, 'job_applications_template.xlsx');
  }
}

module.exports = ExcelService;

