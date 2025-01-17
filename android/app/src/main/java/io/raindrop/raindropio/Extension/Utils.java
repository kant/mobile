package io.raindrop.raindropio.Extension;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Patterns;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import android.webkit.MimeTypeMap;

public class Utils {
    /**
     * Extract urls from string.
     * @param input
     * @return
     */
    public static String extractUrl(String input)
    {
        List<String> result = new ArrayList<String>();

        String[] words = input.split("\\s+");


        Pattern pattern = Patterns.WEB_URL;
        for(String word : words)
        {
            if(pattern.matcher(word).find())
            {
                if(!word.toLowerCase().contains("http://") && !word.toLowerCase().contains("https://"))
                {
                    word = "http://" + word;
                }
                result.add(word);
            }
        }

        if (result.isEmpty())
            return "";

        return result.get(0);
    }

    public static WritableMap getImageFromUri(Uri uri, Context context){
        ContentResolver cr = context.getContentResolver();
        Cursor returnCursor = cr.query(uri, null, null, null, null);
        int nameIndex = returnCursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        returnCursor.moveToFirst();

        WritableMap image = Arguments.createMap();
        image.putString("uri", uri.toString());
        image.putString("type", cr.getType(uri));
        image.putString("name", returnCursor.getString(nameIndex));

        return image;
    }
}
