// utils/xmlParser.js
const { XMLParser, XMLValidator } = require('fast-xml-parser');

// Validate XML structure for Danish survey format
exports.validateXml = (xmlData) => {
  try {
    // Check if XML is well-formed
    const parserOptions = {
      allowBooleanAttributes: true,
      ignoreAttributes: false
    };
    
    if (!XMLValidator.validate(xmlData)) {
      return {
        valid: false,
        errors: ['XML er ikke velformet']
      };
    }
    
    // Parse XML
    const parser = new XMLParser(parserOptions);
    const parsed = parser.parse(xmlData);
    
    // Check required structure for Danish format
    if (!parsed.spørgeskema) {
      return {
        valid: false,
        errors: ['Manglende rod "spørgeskema" element']
      };
    }
    
    // Check for question groups
    if (!parsed.spørgeskema.spørgsmålsgruppe) {
      return {
        valid: false,
        errors: ['Manglende "spørgsmålsgruppe" elementer']
      };
    }
    
    // Ensure question groups have questions
    const groups = Array.isArray(parsed.spørgeskema.spørgsmålsgruppe) 
      ? parsed.spørgeskema.spørgsmålsgruppe 
      : [parsed.spørgeskema.spørgsmålsgruppe];
    
    for (const group of groups) {
      if (!group.spørgsmål) {
        return {
          valid: false,
          errors: ['Spørgsmålsgruppe mangler "spørgsmål" elementer']
        };
      }
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Fejl ved validering af XML:', error);
    return {
      valid: false,
      errors: ['Fejl ved validering af XML: ' + error.message]
    };
  }
};

// Helper function to transform Danish XML format to application format
exports.transformDanishXmlFormat = (xmlData) => {
  try {
    // Fejlfinding: Log de første 200 tegn af XML-data'en
    console.log('XML data start:', xmlData.substring(0, 200));

    const parserOptions = {
      allowBooleanAttributes: true,
      ignoreAttributes: false
    };
    
    // Fejlfinding: Forsøg at parse XML
    console.log('Attempting to parse XML...');
    const parser = new XMLParser(parserOptions);
    const parsed = parser.parse(xmlData);
    console.log('XML parsing successful');
    
    // Fejlfinding: Tjek om rod-elementet er korrekt
    console.log('Root element keys:', Object.keys(parsed));
    
    if (!parsed.spørgeskema) {
      console.log('Missing spørgeskema element. Available keys:', Object.keys(parsed));
      throw new Error('XML mangler spørgeskema rod-element');
    }
    
    // Create a websites array with placeholder URLs that you'll replace with your designs
    const websites = [
      {
        '@_id': '1',
        '@_url': 'http://localhost:5000/designs/website1.html',
        'name': 'Hjemmeside Design 1',
        'description': 'Første hjemmeside til evaluering'
      },
      {
        '@_id': '2',
        '@_url': 'http://localhost:5000/designs/website2.html',
        'name': 'Hjemmeside Design 2',
        'description': 'Anden hjemmeside til evaluering'
      },
      {
        '@_id': '3',
        '@_url': 'http://localhost:5000/designs/website3.html',
        'name': 'Hjemmeside Design 3',
        'description': 'Tredje hjemmeside til evaluering'
      }
    ];
    
    // Extract all questions from all groups
    const allQuestions = [];
    const groups = Array.isArray(parsed.spørgeskema.spørgsmålsgruppe) 
      ? parsed.spørgeskema.spørgsmålsgruppe 
      : [parsed.spørgeskema.spørgsmålsgruppe];
    
    console.log('Found groups:', groups.length);
    
    for (const group of groups) {
      console.log('Processing group:', group.id);
      
      if (!group.spørgsmål) {
        console.log('No questions in group:', group.id);
        continue;
      }
      
      const groupQuestions = Array.isArray(group.spørgsmål) 
        ? group.spørgsmål 
        : [group.spørgsmål];
      
      console.log('Questions in group:', groupQuestions.length);
      
      for (const q of groupQuestions) {
        console.log('Processing question:', q.id, 'type:', q.type);
        
        // Convert Danish question type to application question type
        let questionType = 'text'; // Default
        let min = 1;
        let max = 5;
        
        switch (q.type) {
          case 'tekst':
            questionType = 'text';
            break;
          case 'integer':
            questionType = 'text';
            break;
          case 'dropdown':
            questionType = 'select';
            break;
          case 'skala':
            questionType = 'scale';
            max = parseInt(q.niveauer) || 5;
            break;
          case 'Lickert':
            questionType = 'radio';
            max = parseInt(q.niveauer) || 5;
            break;
          default:
            questionType = 'text';
        }
        
        // Create transformed question object
        const transformedQuestion = {
          '@_id': q.id,
          '@_type': questionType,
          'text': q.tekst,
          'obligatorisk': q.obligatorisk || 'false',
          'group_id': group.id
        };
        
        // Add min/max for scale questions
        if (questionType === 'scale') {
          transformedQuestion['@_min'] = min;
          transformedQuestion['@_max'] = max;
          transformedQuestion['@_minLabel'] = '1';
          transformedQuestion['@_maxLabel'] = q.niveauer || '5';
        }
        
        // Add options for dropdown/select questions
        if (questionType === 'select' || questionType === 'radio') {
          transformedQuestion.options = { option: [] };
          
          if (q.option) {
            const options = Array.isArray(q.option) ? q.option : [q.option];
            
            transformedQuestion.options.option = options.map((opt, index) => ({
              '@_value': String(index + 1),
              '#text': opt
            }));
          }
          
          // For Lickert scale, create standard options
          if (q.type === 'Lickert') {
            const niveauer = parseInt(q.niveauer) || 5;
            
            if (niveauer === 5) {
              transformedQuestion.options.option = [
                { '@_value': '1', '#text': 'Meget uenig' },
                { '@_value': '2', '#text': 'Uenig' },
                { '@_value': '3', '#text': 'Hverken enig eller uenig' },
                { '@_value': '4', '#text': 'Enig' },
                { '@_value': '5', '#text': 'Meget enig' }
              ];
            } else if (niveauer === 6) {
              transformedQuestion.options.option = [
                { '@_value': '1', '#text': 'Meget uenig' },
                { '@_value': '2', '#text': 'Uenig' },
                { '@_value': '3', '#text': 'Lidt uenig' },
                { '@_value': '4', '#text': 'Lidt enig' },
                { '@_value': '5', '#text': 'Enig' },
                { '@_value': '6', '#text': 'Meget enig' }
              ];
            }
          }
        }
        
        allQuestions.push(transformedQuestion);
      }
    }
    
    // Separate demographic and website questions
    const demographicQuestions = allQuestions.filter(q => 
      q.group_id && q.group_id.includes('demografi')
    );
    
    const websiteQuestions = allQuestions.filter(q => 
      !q.group_id || !q.group_id.includes('demografi')
    );
    
    console.log('Total questions:', allQuestions.length);
    console.log('Demographic questions:', demographicQuestions.length);
    console.log('Website questions:', websiteQuestions.length);
    
    // Return transformed structure compatible with the application
    return {
      websites,
      questions: allQuestions,
      demographicQuestions,
      websiteQuestions
    };
  } catch (error) {
    console.error('Error transforming XML format:', error);
    throw error;
  }
};