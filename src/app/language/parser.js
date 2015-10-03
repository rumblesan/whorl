
import * as JisonParser from '../../generated/jison-parser';
import * as Error       from '../error';

JisonParser.parser.yy.parseError = function (message, details) {
    throw Error.create(
        Error.types.parse, message.split('\n'), details
    );
};

export default JisonParser;

